package com.wfcostore.app.web

import android.app.Activity
import android.content.ActivityNotFoundException
import android.content.Intent
import android.net.Uri
import android.util.Log
import android.widget.Toast
import com.wfcostore.app.BuildConfig
import com.wfcostore.app.R
import com.wfcostore.app.util.ClickGuard
import java.net.URISyntaxException

/** Opens URLs in other apps (WhatsApp, dialer, mail, browser) safely. */
class ExternalLauncher(private val activity: Activity) {

    private val guard = ClickGuard()

    fun openUrl(url: String) {
        if (!guard.allow(url)) return
        val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url)).addCategory(Intent.CATEGORY_BROWSABLE)
        if (BuildConfig.DEBUG) Log.d(TAG, "external: ${UrlPolicy.hostOf(url) ?: url.substringBefore(':')}")
        start(intent)
    }

    /**
     * Handles intent:// links the way Chrome does: only browsable activities,
     * no explicit component or selector, falling back to an https URL.
     *
     * @return an https fallback URL the caller should route through UrlPolicy, or null.
     */
    fun openIntentUri(url: String): String? {
        if (!guard.allow(url)) return null
        val intent = try {
            Intent.parseUri(url, Intent.URI_INTENT_SCHEME)
        } catch (e: URISyntaxException) {
            return null
        }
        val fallback = intent.getStringExtra(EXTRA_FALLBACK_URL)
            ?.takeIf { it.startsWith("https://", ignoreCase = true) }
        intent.addCategory(Intent.CATEGORY_BROWSABLE)
        intent.component = null
        intent.selector = null
        return try {
            activity.startActivity(intent)
            null
        } catch (e: ActivityNotFoundException) {
            fallback ?: run {
                toast(R.string.no_app_to_open)
                null
            }
        } catch (e: SecurityException) {
            fallback
        }
    }

    private fun start(intent: Intent) {
        try {
            activity.startActivity(intent)
        } catch (e: ActivityNotFoundException) {
            toast(R.string.no_app_to_open)
        } catch (e: SecurityException) {
            toast(R.string.no_app_to_open)
        }
    }

    private fun toast(res: Int) = Toast.makeText(activity, res, Toast.LENGTH_SHORT).show()

    private companion object {
        const val TAG = "ExternalLauncher"
        const val EXTRA_FALLBACK_URL = "browser_fallback_url"
    }
}
