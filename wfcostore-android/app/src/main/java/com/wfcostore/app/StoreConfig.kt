package com.wfcostore.app

/**
 * Everything store-specific lives here so the app can be retargeted without
 * touching the WebView code.
 */
object StoreConfig {

    const val START_URL = "https://wfcostore.com/ar"

    /**
     * Hosts that are the store itself. Matched exactly (no wildcard), so a new
     * subdomain is only trusted after it is added here deliberately.
     */
    val STORE_HOSTS: Set<String> = setOf(
        "wfcostore.com",
        "www.wfcostore.com",
    )

    /**
     * Third-party hosts that must stay inside the WebView even when the user
     * taps a link to them (payment gateways, 3-D Secure, login providers),
     * because opening them in another app would lose the checkout session.
     * Matched as domain suffixes ("tabby.ai" also matches "checkout.tabby.ai").
     *
     * NOT VERIFIED for this store: the site could not be reached while the app
     * was built. These are common gateways in the region. After a real test
     * checkout, remove the ones the store does not use and add any that are
     * missing (debug builds log the host of every link opened externally).
     *
     * Redirects issued by the store or a gateway always stay in-app regardless
     * of this list; see UrlPolicy.
     */
    val TRUSTED_FLOW_HOST_SUFFIXES: Set<String> = setOf(
        "tap.company",
        "moyasar.com",
        "tabby.ai",
        "tamara.co",
        "oppwa.com",
        "paytabs.com",
        "checkout.com",
        "paypal.com",
    )

    /**
     * Hosts that belong to native apps (WhatsApp, social networks, maps). Always
     * handed to Android so the matching app, or the browser, opens them.
     */
    val EXTERNAL_APP_HOST_SUFFIXES: Set<String> = setOf(
        "wa.me",
        "whatsapp.com",
        "t.me",
        "telegram.me",
        "instagram.com",
        "facebook.com",
        "m.me",
        "twitter.com",
        "x.com",
        "snapchat.com",
        "tiktok.com",
        "youtube.com",
        "youtu.be",
        "linkedin.com",
        "play.google.com",
        "maps.google.com",
        "maps.app.goo.gl",
    )

    /**
     * Payment 3-D Secure frames and some login widgets need third-party cookies.
     * Set to false if the real checkout works without them.
     */
    const val ALLOW_THIRD_PARTY_COOKIES = true

    /**
     * Pull-to-refresh only triggers when the page itself is scrolled to the top.
     * Disable it if the site uses full-screen inner scrolling panels and the
     * gesture fires while scrolling them.
     */
    const val ENABLE_PULL_TO_REFRESH = true

    /** Appended to the default WebView user agent so the store can recognise app traffic. */
    const val USER_AGENT_SUFFIX = "WFCostoreAndroid"
}
