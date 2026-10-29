package com.wfcostore.app.web

import android.app.Activity
import android.net.Uri
import android.os.Message
import android.text.InputType
import android.webkit.GeolocationPermissions
import android.webkit.JsPromptResult
import android.webkit.JsResult
import android.webkit.PermissionRequest
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.EditText
import com.google.android.material.dialog.MaterialAlertDialogBuilder
import com.wfcostore.app.R

class StoreChromeClient(
    private val activity: Activity,
    private val fileChooser: FileChooserHandler,
    private val listener: Listener,
) : WebChromeClient() {

    interface Listener {
        fun onProgress(progress: Int)

        /** A link that asked for a new window (target=_blank / window.open). */
        fun onNewWindowUrl(url: String)
    }

    override fun onProgressChanged(view: WebView, newProgress: Int) {
        listener.onProgress(newProgress)
    }

    override fun onShowFileChooser(
        webView: WebView,
        filePathCallback: ValueCallback<Array<Uri>>,
        fileChooserParams: FileChooserParams,
    ): Boolean = fileChooser.show(filePathCallback, fileChooserParams)

    /**
     * New windows are not opened as separate WebViews. A throw-away WebView
     * captures the first URL, which is then routed through UrlPolicy: store
     * pages load in the main WebView, everything else opens externally.
     * Popups without a user tap are refused.
     */
    override fun onCreateWindow(view: WebView, isDialog: Boolean, isUserGesture: Boolean, resultMsg: Message): Boolean {
        if (!isUserGesture) return false
        val transport = resultMsg.obj as? WebView.WebViewTransport ?: return false

        val catcher = WebView(view.context)
        var handled = false
        fun capture(v: WebView, url: String?) {
            if (handled || url.isNullOrEmpty() || url == "about:blank") return
            handled = true
            v.stopLoading()
            listener.onNewWindowUrl(url)
            v.post { v.destroy() }
        }
        catcher.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(v: WebView, request: WebResourceRequest): Boolean {
                capture(v, request.url.toString())
                return true
            }

            override fun onPageStarted(v: WebView, url: String?, favicon: android.graphics.Bitmap?) {
                capture(v, url)
            }
        }
        transport.webView = catcher
        resultMsg.sendToTarget()
        return true
    }

    // --- JavaScript dialogs: native Material dialogs titled with the page host. ---

    override fun onJsAlert(view: WebView, url: String, message: String, result: JsResult): Boolean {
        if (!canShowDialog()) return cancel(result)
        dialog(url, message)
            .setPositiveButton(android.R.string.ok) { _, _ -> result.confirm() }
            .setOnCancelListener { result.cancel() }
            .show()
        return true
    }

    override fun onJsConfirm(view: WebView, url: String, message: String, result: JsResult): Boolean {
        if (!canShowDialog()) return cancel(result)
        dialog(url, message)
            .setPositiveButton(android.R.string.ok) { _, _ -> result.confirm() }
            .setNegativeButton(android.R.string.cancel) { _, _ -> result.cancel() }
            .setOnCancelListener { result.cancel() }
            .show()
        return true
    }

    override fun onJsPrompt(
        view: WebView,
        url: String,
        message: String,
        defaultValue: String?,
        result: JsPromptResult,
    ): Boolean {
        if (!canShowDialog()) return cancel(result)
        val input = EditText(activity).apply {
            inputType = InputType.TYPE_CLASS_TEXT
            setText(defaultValue)
        }
        dialog(url, message)
            .setView(input)
            .setPositiveButton(android.R.string.ok) { _, _ -> result.confirm(input.text.toString()) }
            .setNegativeButton(android.R.string.cancel) { _, _ -> result.cancel() }
            .setOnCancelListener { result.cancel() }
            .show()
        return true
    }

    override fun onJsBeforeUnload(view: WebView, url: String, message: String, result: JsResult): Boolean {
        if (!canShowDialog()) return cancel(result)
        dialog(url, activity.getString(R.string.leave_page_message))
            .setPositiveButton(R.string.leave) { _, _ -> result.confirm() }
            .setNegativeButton(R.string.stay) { _, _ -> result.cancel() }
            .setOnCancelListener { result.cancel() }
            .show()
        return true
    }

    // --- Device permissions: the app requests none, so web requests are denied. ---

    override fun onPermissionRequest(request: PermissionRequest) {
        request.deny()
    }

    override fun onGeolocationPermissionsShowPrompt(origin: String, callback: GeolocationPermissions.Callback) {
        callback.invoke(origin, false, false)
    }

    private fun canShowDialog() = !activity.isFinishing && !activity.isDestroyed

    private fun cancel(result: JsResult): Boolean {
        result.cancel()
        return true
    }

    private fun dialog(url: String, message: String) =
        MaterialAlertDialogBuilder(activity)
            .setTitle(UrlPolicy.hostOf(url) ?: activity.getString(R.string.app_name))
            .setMessage(message)
            .setCancelable(true)
}
