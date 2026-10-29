package com.wfcostore.app.web

import android.app.Activity
import android.app.DownloadManager
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.webkit.CookieManager
import android.webkit.DownloadListener
import android.webkit.URLUtil
import android.widget.Toast
import com.wfcostore.app.R

/**
 * Sends file downloads (invoices, PDFs) to the system DownloadManager, which
 * shows progress in the notification shade and saves to Downloads.
 *
 * No storage permission is requested: on Android 10+ DownloadManager may write
 * to Downloads without one; on Android 7–9 the link is handed to the browser.
 */
class DownloadHandler(
    private val activity: Activity,
    private val launcher: ExternalLauncher,
) : DownloadListener {

    override fun onDownloadStart(
        url: String,
        userAgent: String?,
        contentDisposition: String?,
        mimeType: String?,
        contentLength: Long,
    ) {
        if (!url.startsWith("https://", ignoreCase = true)) {
            // blob:/data: downloads are generated in-page and cannot be handed to DownloadManager.
            toast(R.string.download_unsupported)
            return
        }
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
            launcher.openUrl(url)
            return
        }
        val fileName = URLUtil.guessFileName(url, contentDisposition, mimeType)
        try {
            val request = DownloadManager.Request(Uri.parse(url)).apply {
                setMimeType(mimeType)
                // Cookies for this URL only, so a logged-in invoice download works.
                CookieManager.getInstance().getCookie(url)?.let { addRequestHeader("Cookie", it) }
                userAgent?.let { addRequestHeader("User-Agent", it) }
                setTitle(fileName)
                setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
                setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, fileName)
            }
            activity.getSystemService(DownloadManager::class.java).enqueue(request)
            toast(R.string.download_started)
        } catch (e: RuntimeException) {
            toast(R.string.download_failed)
        }
    }

    private fun toast(res: Int) = Toast.makeText(activity, res, Toast.LENGTH_SHORT).show()
}
