package app.lparchive.vinyl;

import android.Manifest;
import android.app.Activity;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.os.Build;
import android.support.v4.media.MediaMetadataCompat;
import android.support.v4.media.session.MediaSessionCompat;
import android.support.v4.media.session.PlaybackStateCompat;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;

import androidx.core.app.ActivityCompat;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONObject;

import java.lang.ref.WeakReference;
import java.net.HttpURLConnection;
import java.net.URL;

/**
 * 웹뷰(WebView) 안에서 재생되는 미리듣기 오디오의 정보를 받아
 * 안드로이드 시스템 미디어 세션 + 잠금화면/상태바 알림으로 표시한다.
 * 실제 오디오는 웹뷰의 <audio> 가 재생하고, 이 플러그인은 "표시 + 원격 컨트롤" 역할.
 * 버튼(재생/일시정지/이전/다음/정지)은 window 이벤트로 웹에 다시 전달한다.
 *
 * 호출 경로는 두 가지: Capacitor 플러그인 메서드(update/stop) 와
 * WebView JavascriptInterface(window.LPMediaNative.update/stop) — 원격 로드 앱에서
 * Capacitor 프록시가 안 잡히는 경우를 대비해 후자를 확실한 경로로 함께 제공.
 */
@CapacitorPlugin(name = "LPMedia")
public class LPMediaPlugin extends Plugin {

  private static final String CHANNEL_ID = "lp_media_playback";
  private static final int NOTIF_ID = 4711;
  private static WeakReference<LPMediaPlugin> INSTANCE;

  private MediaSessionCompat session;
  private Bitmap art;
  private String artUrl;
  private String tTitle = "";
  private String tArtist = "";
  private String tAlbum = "";
  private boolean tPlaying = false;

  @Override
  public void load() {
    INSTANCE = new WeakReference<>(this);
    try {
      final WebView wv = getBridge().getWebView();
      if (wv != null) {
        wv.post(new Runnable() {
          @Override public void run() {
            try { wv.addJavascriptInterface(new JsApi(), "LPMediaNative"); } catch (Exception e) {}
          }
        });
      }
    } catch (Exception e) {}
  }

  void fire(final String action) {
    final Activity act = getActivity();
    Runnable r = new Runnable() {
      @Override public void run() {
        // 확실한 경로: WebView 에 직접 JS 실행
        try {
          WebView wv = getBridge().getWebView();
          if (wv != null) {
            wv.evaluateJavascript("window.__lpMediaAction && window.__lpMediaAction('" + action + "')", null);
          }
        } catch (Exception e) {}
        // 폴백: window 이벤트
        try { getBridge().triggerWindowJSEvent("lpMediaAction", "{\"action\":\"" + action + "\"}"); } catch (Exception e) {}
      }
    };
    if (act != null) act.runOnUiThread(r); else r.run();
  }

  private void reportDebug(final String msg) {
    try {
      String safe = msg == null ? "" : msg.replace("\\", " ").replace("\"", "'").replace("\n", " ");
      getBridge().triggerWindowJSEvent("lpMediaDebug", "{\"msg\":\"" + safe + "\"}");
    } catch (Exception e) {}
  }

  // ---- 공개 호출 경로 1: Capacitor 플러그인 메서드 ----
  @PluginMethod
  public void update(final PluginCall call) {
    String title = call.getString("title", "");
    String artist = call.getString("artist", "");
    String album = call.getString("album", "");
    String cover = call.getString("cover", "");
    Boolean pb = call.getBoolean("playing", Boolean.TRUE);
    Double dd = call.getDouble("duration");
    Double pp = call.getDouble("position");
    long durMs = (long) ((dd == null ? 0.0 : dd) * 1000);
    long posMs = (long) ((pp == null ? 0.0 : pp) * 1000);
    applyUpdate(title, artist, album, cover, pb != null && pb, durMs, posMs);
    call.resolve();
  }

  @PluginMethod
  public void stop(final PluginCall call) {
    stopInternal();
    call.resolve();
  }

  // ---- 공개 호출 경로 2: WebView JavascriptInterface ----
  public class JsApi {
    @JavascriptInterface
    public void update(String json) {
      try {
        JSONObject o = new JSONObject(json);
        applyUpdate(
            o.optString("title", ""),
            o.optString("artist", ""),
            o.optString("album", ""),
            o.optString("cover", ""),
            o.optBoolean("playing", true),
            (long) (o.optDouble("duration", 0.0) * 1000),
            (long) (o.optDouble("position", 0.0) * 1000));
      } catch (Exception e) {}
    }

    @JavascriptInterface
    public void stop() { stopInternal(); }
  }

  // ---- 공통 로직 ----
  private void applyUpdate(final String title, final String artist, final String album,
                           final String cover, final boolean playing, final long durMs, final long posMs) {
    final Activity act = getActivity();
    if (act == null) return;
    act.runOnUiThread(new Runnable() {
      @Override public void run() {
        try {
          tTitle = title; tArtist = artist; tAlbum = album; tPlaying = playing;
          requestNotifPermission();
          ensureChannel();
          ensureSession();
          applyMetadata(durMs);
          applyState(posMs);
          session.setActive(true);
          showNotification();
          if (cover != null && cover.length() > 0 && !cover.equals(artUrl)) {
            artUrl = cover;
            loadArt(cover, durMs);
          }
          boolean enabled = true;
          try { enabled = NotificationManagerCompat.from(getContext()).areNotificationsEnabled(); } catch (Exception e) {}
          reportDebug("upd ok sdk=" + Build.VERSION.SDK_INT + " notif=" + (enabled ? "on" : "off")
              + " active=" + (session != null && session.isActive()));
        } catch (Throwable t) {
          reportDebug("upd ERR " + t.getClass().getSimpleName() + ": " + t.getMessage());
        }
      }
    });
  }

  private void stopInternal() {
    final Activity act = getActivity();
    if (act == null) return;
    act.runOnUiThread(new Runnable() {
      @Override public void run() {
        try {
          if (session != null) session.setActive(false);
          NotificationManagerCompat.from(getContext()).cancel(NOTIF_ID);
        } catch (Exception e) {}
      }
    });
  }

  private void ensureChannel() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      NotificationManager nm = (NotificationManager) getContext().getSystemService(Context.NOTIFICATION_SERVICE);
      if (nm != null && nm.getNotificationChannel(CHANNEL_ID) == null) {
        NotificationChannel ch = new NotificationChannel(CHANNEL_ID, "재생 중", NotificationManager.IMPORTANCE_LOW);
        ch.setShowBadge(false);
        ch.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
        nm.createNotificationChannel(ch);
      }
    }
  }

  private void ensureSession() {
    if (session != null) return;
    session = new MediaSessionCompat(getContext(), "LPArchive");
    session.setFlags(MediaSessionCompat.FLAG_HANDLES_MEDIA_BUTTONS | MediaSessionCompat.FLAG_HANDLES_TRANSPORT_CONTROLS);
    session.setCallback(new MediaSessionCompat.Callback() {
      @Override public void onPlay() { fire("play"); }
      @Override public void onPause() { fire("pause"); }
      @Override public void onSkipToNext() { fire("next"); }
      @Override public void onSkipToPrevious() { fire("prev"); }
      @Override public void onStop() { fire("stop"); }
    });
  }

  private void requestNotifPermission() {
    if (Build.VERSION.SDK_INT >= 33) {
      Activity act = getActivity();
      if (act != null && ContextCompat.checkSelfPermission(getContext(), Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
        try { ActivityCompat.requestPermissions(act, new String[]{ Manifest.permission.POST_NOTIFICATIONS }, 9911); } catch (Exception e) {}
      }
    }
  }

  private void applyMetadata(long duration) {
    MediaMetadataCompat.Builder mb = new MediaMetadataCompat.Builder()
        .putString(MediaMetadataCompat.METADATA_KEY_TITLE, tTitle)
        .putString(MediaMetadataCompat.METADATA_KEY_ARTIST, tArtist)
        .putString(MediaMetadataCompat.METADATA_KEY_ALBUM, tAlbum)
        .putLong(MediaMetadataCompat.METADATA_KEY_DURATION, duration);
    if (art != null) mb.putBitmap(MediaMetadataCompat.METADATA_KEY_ALBUM_ART, art);
    session.setMetadata(mb.build());
  }

  private void applyState(long position) {
    long actions = PlaybackStateCompat.ACTION_PLAY | PlaybackStateCompat.ACTION_PAUSE
        | PlaybackStateCompat.ACTION_PLAY_PAUSE | PlaybackStateCompat.ACTION_STOP
        | PlaybackStateCompat.ACTION_SKIP_TO_NEXT | PlaybackStateCompat.ACTION_SKIP_TO_PREVIOUS;
    PlaybackStateCompat state = new PlaybackStateCompat.Builder()
        .setActions(actions)
        .setState(tPlaying ? PlaybackStateCompat.STATE_PLAYING : PlaybackStateCompat.STATE_PAUSED, position, 1.0f)
        .build();
    session.setPlaybackState(state);
  }

  private PendingIntent actPI(String action, int rc) {
    Intent i = new Intent(getContext(), LPMediaReceiver.class);
    i.setAction("app.lparchive.vinyl.LPACT." + action);
    i.putExtra("lp_action", action);
    int f = PendingIntent.FLAG_UPDATE_CURRENT;
    if (Build.VERSION.SDK_INT >= 23) f |= PendingIntent.FLAG_IMMUTABLE;
    return PendingIntent.getBroadcast(getContext(), rc, i, f);
  }

  private void showNotification() {
    Context ctx = getContext();
    int icon = ctx.getApplicationInfo().icon;
    Intent open = ctx.getPackageManager().getLaunchIntentForPackage(ctx.getPackageName());
    int piFlag = PendingIntent.FLAG_UPDATE_CURRENT;
    if (Build.VERSION.SDK_INT >= 23) piFlag |= PendingIntent.FLAG_IMMUTABLE;
    PendingIntent contentPI = open != null ? PendingIntent.getActivity(ctx, 0, open, piFlag) : null;

    NotificationCompat.Builder b = new NotificationCompat.Builder(ctx, CHANNEL_ID)
        .setSmallIcon(icon)
        .setContentTitle(tTitle)
        .setContentText(tArtist)
        .setSubText(tAlbum)
        .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
        .setOnlyAlertOnce(true)
        .setOngoing(false)                       // 스와이프로 지울 수 있게(고정 해제)
        .setDeleteIntent(actPI("stop", 5));      // 스와이프로 지우면 재생 정지
    if (contentPI != null) b.setContentIntent(contentPI);
    if (art != null) b.setLargeIcon(art);

    b.addAction(new NotificationCompat.Action(android.R.drawable.ic_media_previous, "이전", actPI("prev", 1)));
    b.addAction(new NotificationCompat.Action(
        tPlaying ? android.R.drawable.ic_media_pause : android.R.drawable.ic_media_play,
        tPlaying ? "일시정지" : "재생",
        actPI(tPlaying ? "pause" : "play", 2)));
    b.addAction(new NotificationCompat.Action(android.R.drawable.ic_media_next, "다음", actPI("next", 3)));

    androidx.media.app.NotificationCompat.MediaStyle style = new androidx.media.app.NotificationCompat.MediaStyle()
        .setMediaSession(session.getSessionToken())
        .setShowActionsInCompactView(0, 1, 2)
        .setShowCancelButton(true)
        .setCancelButtonIntent(actPI("stop", 4));
    b.setStyle(style);

    try { NotificationManagerCompat.from(ctx).notify(NOTIF_ID, b.build()); } catch (Exception e) {}
  }

  private void loadArt(final String urlStr, final long duration) {
    new Thread(new Runnable() {
      @Override public void run() {
        try {
          URL url = new URL(urlStr);
          HttpURLConnection c = (HttpURLConnection) url.openConnection();
          c.setConnectTimeout(8000);
          c.setReadTimeout(8000);
          c.setDoInput(true);
          c.connect();
          final Bitmap bmp = BitmapFactory.decodeStream(c.getInputStream());
          c.disconnect();
          if (bmp == null) return;
          final Activity act = getActivity();
          if (act == null) return;
          act.runOnUiThread(new Runnable() {
            @Override public void run() {
              art = bmp;
              if (session != null) { applyMetadata(duration); showNotification(); }
            }
          });
        } catch (Exception e) {}
      }
    }).start();
  }

  /** 알림 버튼(이전/재생·일시정지/다음/정지) → 웹으로 다시 전달 */
  public static class LPMediaReceiver extends BroadcastReceiver {
    @Override public void onReceive(Context context, Intent intent) {
      String action = intent != null ? intent.getStringExtra("lp_action") : null;
      LPMediaPlugin p = INSTANCE != null ? INSTANCE.get() : null;
      if (action != null && p != null) p.fire(action);
    }
  }
}
