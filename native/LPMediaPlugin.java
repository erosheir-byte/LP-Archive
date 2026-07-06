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

import androidx.core.app.ActivityCompat;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.lang.ref.WeakReference;
import java.net.HttpURLConnection;
import java.net.URL;

/**
 * 웹뷰(WebView) 안에서 재생되는 미리듣기 오디오의 정보를 받아
 * 안드로이드 시스템 미디어 세션 + 잠금화면/상태바 알림으로 표시한다.
 * 실제 오디오는 웹뷰의 <audio> 가 재생하고, 이 플러그인은 "표시 + 원격 컨트롤" 역할.
 * 버튼(재생/일시정지/이전/다음/정지)은 window 이벤트로 웹에 다시 전달한다.
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
  }

  void fire(final String action) {
    try {
      getBridge().triggerWindowJSEvent("lpMediaAction", "{\"action\":\"" + action + "\"}");
    } catch (Exception e) {}
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

  @PluginMethod
  public void update(final PluginCall call) {
    tTitle = call.getString("title", "");
    tArtist = call.getString("artist", "");
    tAlbum = call.getString("album", "");
    Boolean pb = call.getBoolean("playing", Boolean.TRUE);
    tPlaying = pb != null && pb;
    final String cover = call.getString("cover", "");
    Double dd = call.getDouble("duration");
    Double pp = call.getDouble("position");
    final long duration = (long) ((dd == null ? 0.0 : dd) * 1000);
    final long position = (long) ((pp == null ? 0.0 : pp) * 1000);
    final Activity act = getActivity();
    if (act == null) { call.resolve(); return; }
    act.runOnUiThread(new Runnable() {
      @Override public void run() {
        try {
          requestNotifPermission();
          ensureChannel();
          ensureSession();
          applyMetadata(duration);
          applyState(position);
          session.setActive(true);
          showNotification();
          if (cover != null && cover.length() > 0 && !cover.equals(artUrl)) {
            artUrl = cover;
            loadArt(cover, duration);
          }
        } catch (Exception e) {}
      }
    });
    call.resolve();
  }

  @PluginMethod
  public void stop(final PluginCall call) {
    final Activity act = getActivity();
    if (act != null) {
      act.runOnUiThread(new Runnable() {
        @Override public void run() {
          try {
            if (session != null) session.setActive(false);
            NotificationManagerCompat.from(getContext()).cancel(NOTIF_ID);
          } catch (Exception e) {}
        }
      });
    }
    call.resolve();
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
        .setOngoing(tPlaying);
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
