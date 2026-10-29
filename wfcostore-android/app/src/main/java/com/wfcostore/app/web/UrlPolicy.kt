package com.wfcostore.app.web

import java.net.URI
import java.util.Locale

/**
 * Decides where every navigation goes. Pure Kotlin (no Android types) so it is
 * covered by plain JVM unit tests.
 */
class UrlPolicy(
    private val storeHosts: Set<String>,
    private val trustedFlowHostSuffixes: Set<String>,
    private val externalAppHostSuffixes: Set<String>,
) {

    sealed interface Decision {
        /** Let the WebView load it. */
        data object LoadInApp : Decision

        /** A store page requested over http; load the https version instead. */
        data class LoadUpgraded(val httpsUrl: String) : Decision

        /** Hand to Android (browser, WhatsApp, dialer, mail, ...). */
        data class OpenExternally(val url: String) : Decision

        /** An intent:// URL; parse it safely before launching. */
        data class LaunchIntentUri(val url: String) : Decision

        /** Drop it silently. */
        data object Block : Decision
    }

    /**
     * @param url the URL being navigated to.
     * @param userInitiated true when the user tapped something and the request is
     *   not a server redirect. Redirects are chosen by the server we already
     *   trusted (store or gateway), so they are not treated as user navigation.
     * @param currentUrl the page the navigation starts from, if known.
     */
    fun decide(url: String, userInitiated: Boolean, currentUrl: String?): Decision {
        val scheme = url.substringBefore(':', "").lowercase(Locale.ROOT)
        val inThirdPartyFlow = isHttps(currentUrl) && !isStoreUrl(currentUrl)

        return when (scheme) {
            "https" -> decideHttps(url, userInitiated, inThirdPartyFlow)
            "http" -> {
                val host = hostOf(url)
                if (host != null && host in storeHosts) {
                    Decision.LoadUpgraded("https" + url.substring(url.indexOf(':')))
                } else if (userInitiated) {
                    // Cleartext is never loaded in-app; let the browser deal with it.
                    Decision.OpenExternally(url)
                } else {
                    Decision.Block
                }
            }
            // Common app links: always fine to hand off when the user asked.
            "tel", "mailto", "sms", "smsto", "whatsapp", "geo", "market" ->
                if (userInitiated || inThirdPartyFlow) Decision.OpenExternally(url) else Decision.Block
            "intent" ->
                if (userInitiated || inThirdPartyFlow) Decision.LaunchIntentUri(url) else Decision.Block
            // Never navigate the top frame to local or script content.
            "", "javascript", "file", "content", "data", "blob", "about" -> Decision.Block
            // Unknown custom scheme (for example a bank app callback during payment).
            else ->
                if (userInitiated || inThirdPartyFlow) Decision.OpenExternally(url) else Decision.Block
        }
    }

    fun isStoreUrl(url: String?): Boolean {
        if (!isHttps(url)) return false
        val host = hostOf(url!!) ?: return false
        return host in storeHosts
    }

    fun isAllowedInitialUrl(url: String?): Boolean = isStoreUrl(url)

    private fun decideHttps(url: String, userInitiated: Boolean, inThirdPartyFlow: Boolean): Decision {
        val host = hostOf(url) ?: return Decision.Block
        return when {
            host in storeHosts -> Decision.LoadInApp
            matchesAny(host, externalAppHostSuffixes) -> Decision.OpenExternally(url)
            matchesAny(host, trustedFlowHostSuffixes) -> Decision.LoadInApp
            // Store or gateway sent us here by redirect or script: part of checkout/login.
            !userInitiated -> Decision.LoadInApp
            // Already inside a gateway page: its own links (bank 3-D Secure etc.) stay in-app.
            inThirdPartyFlow -> Decision.LoadInApp
            // A link the user tapped to an unknown site.
            else -> Decision.OpenExternally(url)
        }
    }

    private fun isHttps(url: String?): Boolean =
        url != null && url.regionMatches(0, "https:", 0, 6, ignoreCase = true)

    private fun matchesAny(host: String, suffixes: Set<String>): Boolean =
        suffixes.any { host == it || host.endsWith(".$it") }

    companion object {
        fun hostOf(url: String): String? = try {
            URI(url).host?.lowercase(Locale.ROOT)?.trimEnd('.')
        } catch (e: Exception) {
            null
        }
    }
}
