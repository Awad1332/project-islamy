package com.wfcostore.app.web

import android.annotation.SuppressLint
import android.webkit.CookieManager
import android.webkit.WebSettings
import android.webkit.WebView
import androidx.webkit.WebSettingsCompat
import androidx.webkit.WebViewFeature
import com.wfcostore.app.BuildConfig
import com.wfcostore.app.StoreConfig

object WebViewConfigurator {

    // JavaScript is required: cart, product options and checkout on the store are script-driven.
    @SuppressLint("SetJavaScriptEnabled")
    fun configure(webView: WebView) {
        WebView.setWebContentsDebuggingEnabled(BuildConfig.DEBUG)

        with(webView.settings) {
            javaScriptEnabled = true
            javaScriptCanOpenWindowsAutomatically = false
            setSupportMultipleWindows(true) // so target=_blank reaches onCreateWindow
            domStorageEnabled = true

            // No access to local files or content providers from web content.
            allowFileAccess = false
            allowContentAccess = false

            mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW
            mediaPlaybackRequiresUserGesture = true
            setGeolocationEnabled(false)

            // Respect the site's viewport; allow pinch zoom for product images without on-screen buttons.
            useWideViewPort = true
            loadWithOverviewMode = true
            setSupportZoom(true)
            builtInZoomControls = true
            displayZoomControls = false

            cacheMode = WebSettings.LOAD_DEFAULT
            userAgentString = "$userAgentString ${StoreConfig.USER_AGENT_SUFFIX}/${BuildConfig.VERSION_NAME}"
        }

        if (WebViewFeature.isFeatureSupported(WebViewFeature.SAFE_BROWSING_ENABLE)) {
            WebSettingsCompat.setSafeBrowsingEnabled(webView.settings, true)
        }
        // Show the store's own colours; do not let the WebView invert them in dark mode.
        if (WebViewFeature.isFeatureSupported(WebViewFeature.ALGORITHMIC_DARKENING)) {
            WebSettingsCompat.setAlgorithmicDarkeningAllowed(webView.settings, false)
        }

        CookieManager.getInstance().apply {
            setAcceptCookie(true)
            setAcceptThirdPartyCookies(webView, StoreConfig.ALLOW_THIRD_PARTY_COOKIES)
        }
    }
}
