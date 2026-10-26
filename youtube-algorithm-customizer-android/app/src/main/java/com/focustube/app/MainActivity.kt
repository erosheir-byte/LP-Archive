package com.focustube.app

import android.annotation.SuppressLint
import android.content.Intent
import android.graphics.Color
import android.net.Uri
import android.os.Bundle
import android.view.View
import android.view.ViewGroup
import android.webkit.JavascriptInterface
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.FrameLayout
import android.widget.ImageButton
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private var injectScript: String = ""

    // 전체화면 재생 지원용
    private var customView: View? = null
    private var customViewCallback: WebChromeClient.CustomViewCallback? = null

    // WebView 내에서 직접 탐색을 허용할 도메인
    private val allowedHosts = listOf(
        "youtube.com", "youtu.be", "google.com", "googleusercontent.com",
        "gstatic.com", "googlevideo.com", "ggpht.com", "googleapis.com"
    )

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        injectScript = assets.open("inject.js").bufferedReader().use { it.readText() }

        findViewById<ImageButton>(R.id.btn_settings).setOnClickListener {
            startActivity(Intent(this, SettingsActivity::class.java))
        }

        webView = findViewById(R.id.webview)
        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            mediaPlaybackRequiresUserGesture = false
            // "wv" 토큰을 제거해 일반 모바일 크롬처럼 보이게 한다.
            // (구글이 WebView에서의 로그인을 차단하는 것을 완화)
            userAgentString = userAgentString
                .replace("; wv", "")
                .replace(Regex("Version/\\d+\\.\\d+ "), "")
        }

        webView.addJavascriptInterface(Bridge(), "FocusTubeBridge")

        webView.webViewClient = object : WebViewClient() {
            override fun onPageFinished(view: WebView, url: String) {
                view.evaluateJavascript(injectScript, null)
            }

            override fun shouldOverrideUrlLoading(
                view: WebView,
                request: WebResourceRequest
            ): Boolean {
                val host = request.url.host ?: return false
                val allowed = allowedHosts.any { host == it || host.endsWith(".$it") }
                if (!allowed) {
                    // 외부 링크는 기본 브라우저로
                    runCatching { startActivity(Intent(Intent.ACTION_VIEW, request.url)) }
                    return true
                }
                return false
            }
        }

        webView.webChromeClient = object : WebChromeClient() {
            override fun onShowCustomView(view: View, callback: CustomViewCallback) {
                if (customView != null) {
                    callback.onCustomViewHidden()
                    return
                }
                customView = view
                customViewCallback = callback
                view.setBackgroundColor(Color.BLACK)
                (window.decorView as ViewGroup).addView(
                    view,
                    FrameLayout.LayoutParams(
                        ViewGroup.LayoutParams.MATCH_PARENT,
                        ViewGroup.LayoutParams.MATCH_PARENT
                    )
                )
            }

            override fun onHideCustomView() {
                customView?.let { (window.decorView as ViewGroup).removeView(it) }
                customView = null
                customViewCallback?.onCustomViewHidden()
                customViewCallback = null
            }
        }

        if (savedInstanceState == null) {
            webView.loadUrl("https://m.youtube.com")
        } else {
            webView.restoreState(savedInstanceState)
        }

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                when {
                    customView != null -> webView.webChromeClient?.onHideCustomView()
                    webView.canGoBack() -> webView.goBack()
                    else -> finish()
                }
            }
        })
    }

    override fun onResume() {
        super.onResume()
        // 설정 화면에서 돌아오면 페이지의 스크립트에 변경 사항을 반영한다.
        if (::webView.isInitialized) {
            webView.evaluateJavascript(
                "window.__ftcSync && window.__ftcSync();", null
            )
        }
    }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        webView.saveState(outState)
    }

    /** 주입된 스크립트가 앱 설정을 읽거나 설정 화면을 열 때 쓰는 브리지. */
    inner class Bridge {
        @JavascriptInterface
        fun getSettings(): String = AppSettings.toJson(this@MainActivity)

        @JavascriptInterface
        fun openSettings() {
            startActivity(Intent(this@MainActivity, SettingsActivity::class.java))
        }
    }
}
