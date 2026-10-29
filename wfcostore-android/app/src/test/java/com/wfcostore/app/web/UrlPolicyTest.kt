package com.wfcostore.app.web

import com.wfcostore.app.StoreConfig
import com.wfcostore.app.web.UrlPolicy.Decision
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class UrlPolicyTest {

    private val policy = UrlPolicy(
        StoreConfig.STORE_HOSTS,
        StoreConfig.TRUSTED_FLOW_HOST_SUFFIXES,
        StoreConfig.EXTERNAL_APP_HOST_SUFFIXES,
    )
    private val store = "https://wfcostore.com/ar"
    private val gateway = "https://checkout.tabby.ai/session/1"

    @Test fun storePagesLoadInApp() {
        assertEquals(Decision.LoadInApp, policy.decide("https://wfcostore.com/ar/cart", true, store))
        assertEquals(Decision.LoadInApp, policy.decide("https://www.wfcostore.com/ar/p/1", true, store))
        assertEquals(Decision.LoadInApp, policy.decide("https://WFCOSTORE.com/ar", true, store))
    }

    @Test fun unknownSubdomainIsNotTrustedByDefault() {
        assertEquals(
            Decision.OpenExternally("https://evil.wfcostore.com.attacker.io/"),
            policy.decide("https://evil.wfcostore.com.attacker.io/", true, store),
        )
        assertEquals(
            Decision.OpenExternally("https://shop.wfcostore.com/"),
            policy.decide("https://shop.wfcostore.com/", true, store),
        )
    }

    @Test fun httpStoreLinkIsUpgraded() {
        assertEquals(
            Decision.LoadUpgraded("https://wfcostore.com/ar/x?a=1"),
            policy.decide("http://wfcostore.com/ar/x?a=1", true, store),
        )
    }

    @Test fun httpExternalIsNeverLoadedInApp() {
        assertEquals(Decision.OpenExternally("http://example.com/"), policy.decide("http://example.com/", true, store))
        assertEquals(Decision.Block, policy.decide("http://example.com/", false, store))
    }

    @Test fun whatsappPhoneMailOpenExternally() {
        assertEquals(Decision.OpenExternally("https://wa.me/966500000000"), policy.decide("https://wa.me/966500000000", true, store))
        assertEquals(
            Decision.OpenExternally("https://api.whatsapp.com/send?phone=1"),
            policy.decide("https://api.whatsapp.com/send?phone=1", true, store),
        )
        assertEquals(Decision.OpenExternally("tel:+966500000000"), policy.decide("tel:+966500000000", true, store))
        assertEquals(Decision.OpenExternally("mailto:a@b.c"), policy.decide("mailto:a@b.c", true, store))
        assertEquals(Decision.OpenExternally("whatsapp://send?phone=1"), policy.decide("whatsapp://send?phone=1", true, store))
    }

    @Test fun appSchemesWithoutGestureFromStoreAreBlocked() {
        assertEquals(Decision.Block, policy.decide("tel:+966500000000", false, store))
        assertEquals(Decision.Block, policy.decide("intent://x#Intent;scheme=y;end", false, store))
    }

    @Test fun unknownLinkTappedByUserOpensExternally() {
        assertEquals(Decision.OpenExternally("https://example.com/"), policy.decide("https://example.com/", true, store))
    }

    @Test fun redirectsFromStoreStayInApp() {
        assertEquals(Decision.LoadInApp, policy.decide("https://pay.unknown-gateway.com/x", false, store))
    }

    @Test fun trustedGatewayStaysInAppEvenWhenTapped() {
        assertEquals(Decision.LoadInApp, policy.decide(gateway, true, store))
    }

    @Test fun linksInsideAGatewayFlowStayInApp() {
        assertEquals(Decision.LoadInApp, policy.decide("https://acs.somebank.com/3ds", true, gateway))
        assertEquals(Decision.OpenExternally("bankapp://pay"), policy.decide("bankapp://pay", false, gateway))
    }

    @Test fun dangerousSchemesAreBlocked() {
        listOf("javascript:alert(1)", "file:///sdcard/x", "content://x/y", "data:text/html,hi", "blob:https://x/1")
            .forEach { assertEquals(it, Decision.Block, policy.decide(it, true, store)) }
    }

    @Test fun intentUrlsAreParsedSeparately() {
        val url = "intent://send#Intent;scheme=whatsapp;package=com.whatsapp;end"
        assertEquals(Decision.LaunchIntentUri(url), policy.decide(url, true, store))
    }

    @Test fun malformedUrlIsBlocked() {
        assertEquals(Decision.Block, policy.decide("https://exa mple.com/", true, store))
    }

    @Test fun initialUrlMustBeStoreHttps() {
        assertTrue(policy.isAllowedInitialUrl("https://wfcostore.com/ar/p/1"))
        assertFalse(policy.isAllowedInitialUrl("http://wfcostore.com/ar"))
        assertFalse(policy.isAllowedInitialUrl("https://example.com"))
        assertFalse(policy.isAllowedInitialUrl(null))
    }
}
