package com.wfcostore.app.web

import android.graphics.Bitmap
import android.net.http.SslError
import android.webkit.CookieManager
import android.webkit.RenderProcessGoneDetail
import android.webkit.SslErrorHandler
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.webkit.WebViewClient

class StoreWebViewClient(
    private val policy: UrlPolicy,
    private val listener: Listener,
) : WebViewClient() {

    enum class ErrorKind { CONNECTION, SSL, SERVER }

    interface Listener {
        fun onPageStarted(url: String)
        fun onPageVisible()
        fun onPageFinished(url: String)
        fun onMainFrameError(kind: ErrorKind, failedUrl: String?)
        fun onDecision(view: WebView, decision: UrlPolicy.Decision)
        fun onRendererGone()
    }

    /** Last top-level URL requested, used to tell main-frame SSL failures from sub-resource ones. */
    private var pendingMainUrl: String? = null

    /** Call before loadUrl()/reload() issued by the app itself. */
    fun noteMainFrameRequest(url: String?) {
        pendingMainUrl = url
    }

    override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
        val url = request.url.toString()
        val isWeb = url.startsWith("https:", ignoreCase = true) || url.startsWith("http:", ignoreCase = true)
        // Sub-frames (payment widgets, maps) load normally; mixed content is blocked by settings.
        if (!request.isForMainFrame && isWeb) return false

        val userInitiated = request.hasGesture() && !request.isRedirect
        val decision = policy.decide(url, userInitiated, view.url)
        if (decision == UrlPolicy.Decision.LoadInApp) {
            if (request.isForMainFrame) pendingMainUrl = url
            return false
        }
        listener.onDecision(view, decision)
        return true
    }

    override fun onPageStarted(view: WebView, url: String, favicon: Bitmap?) {
        pendingMainUrl = url
        listener.onPageStarted(url)
    }

    override fun onPageCommitVisible(view: WebView, url: String) {
        listener.onPageVisible()
    }

    override fun onPageFinished(view: WebView, url: String) {
        // Persist login and cart cookies promptly in case the process is killed.
        CookieManager.getInstance().flush()
        listener.onPageFinished(url)
    }

    override fun onReceivedError(view: WebView, request: WebResourceRequest, error: WebResourceError) {
        if (!request.isForMainFrame) return
        // The page was blocked by our own policy, not a network failure.
        if (error.errorCode == ERROR_UNSUPPORTED_SCHEME) return
        listener.onMainFrameError(ErrorKind.CONNECTION, request.url.toString())
    }

    override fun onReceivedHttpError(view: WebView, request: WebResourceRequest, response: WebResourceResponse) {
        // 4xx pages are rendered by the store itself (e.g. its own 404 page); only server failures get our screen.
        if (request.isForMainFrame && response.statusCode >= 500) {
            listener.onMainFrameError(ErrorKind.SERVER, request.url.toString())
        }
    }

    override fun onReceivedSslError(view: WebView, handler: SslErrorHandler, error: SslError) {
        // Never proceed on certificate errors.
        handler.cancel()
        val pending = pendingMainUrl
        val isMainFrame = pending != null &&
            (pending == error.url || UrlPolicy.hostOf(pending) == UrlPolicy.hostOf(error.url))
        if (isMainFrame) {
            listener.onMainFrameError(ErrorKind.SSL, error.url)
        }
    }

    override fun onRenderProcessGone(view: WebView, detail: RenderProcessGoneDetail): Boolean {
        // Returning true keeps the app alive; the activity rebuilds the WebView.
        listener.onRendererGone()
        return true
    }
}
