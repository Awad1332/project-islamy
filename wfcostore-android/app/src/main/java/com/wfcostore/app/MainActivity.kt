package com.wfcostore.app

import android.content.Intent
import android.content.res.Configuration
import android.os.Bundle
import android.os.Parcel
import android.view.View
import android.view.ViewGroup
import android.webkit.WebView
import android.widget.Button
import android.widget.FrameLayout
import android.widget.TextView
import androidx.activity.OnBackPressedCallback
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.isVisible
import androidx.core.view.updatePadding
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout
import com.google.android.material.progressindicator.LinearProgressIndicator
import com.wfcostore.app.util.ClickGuard
import com.wfcostore.app.util.NetworkMonitor
import com.wfcostore.app.web.DownloadHandler
import com.wfcostore.app.web.ExternalLauncher
import com.wfcostore.app.web.FileChooserHandler
import com.wfcostore.app.web.StoreChromeClient
import com.wfcostore.app.web.StoreWebViewClient
import com.wfcostore.app.web.StoreWebViewClient.ErrorKind
import com.wfcostore.app.web.UrlPolicy
import com.wfcostore.app.web.UrlPolicy.Decision
import com.wfcostore.app.web.WebViewConfigurator

class MainActivity : AppCompatActivity(), StoreWebViewClient.Listener, StoreChromeClient.Listener {

    private val policy = UrlPolicy(
        StoreConfig.STORE_HOSTS,
        StoreConfig.TRUSTED_FLOW_HOST_SUFFIXES,
        StoreConfig.EXTERNAL_APP_HOST_SUFFIXES,
    )

    private lateinit var webContainer: FrameLayout
    private lateinit var swipeRefresh: SwipeRefreshLayout
    private lateinit var progress: LinearProgressIndicator
    private lateinit var errorView: View
    private lateinit var errorTitle: TextView
    private lateinit var errorMessage: TextView

    private lateinit var webView: WebView
    private lateinit var webClient: StoreWebViewClient
    private lateinit var launcher: ExternalLauncher
    private lateinit var fileChooser: FileChooserHandler
    private lateinit var networkMonitor: NetworkMonitor

    private val retryGuard = ClickGuard(windowMs = 800L)
    private var failedUrl: String? = null
    private var keepSplash = true

    override fun onCreate(savedInstanceState: Bundle?) {
        val splash = installSplashScreen()
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContentView(R.layout.activity_main)
        splash.setKeepOnScreenCondition { keepSplash }

        webContainer = findViewById(R.id.web_container)
        swipeRefresh = findViewById(R.id.swipe_refresh)
        progress = findViewById(R.id.progress)
        errorView = findViewById(R.id.error_view)
        errorTitle = findViewById(R.id.error_title)
        errorMessage = findViewById(R.id.error_message)

        applyWindowInsets()
        launcher = ExternalLauncher(this)
        fileChooser = FileChooserHandler(this)
        networkMonitor = NetworkMonitor(this, ::onNetworkAvailable)

        findViewById<Button>(R.id.retry_button).setOnClickListener {
            if (retryGuard.allow()) retry()
        }
        setUpSwipeRefresh()
        onBackPressedDispatcher.addCallback(this, backCallback)

        createWebView()
        val restored = savedInstanceState?.getBundle(KEY_WEBVIEW)?.let { webView.restoreState(it) } != null
        if (!restored) {
            load(deepLinkUrl(intent) ?: StoreConfig.START_URL)
        }
        // Never hold the splash longer than this, even on a slow network.
        webContainer.postDelayed({ keepSplash = false }, SPLASH_TIMEOUT_MS)
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        deepLinkUrl(intent)?.let { load(it) }
    }

    override fun onStart() {
        super.onStart()
        networkMonitor.start()
    }

    override fun onResume() {
        super.onResume()
        webView.onResume()
        webView.resumeTimers()
    }

    override fun onPause() {
        webView.onPause()
        webView.pauseTimers()
        android.webkit.CookieManager.getInstance().flush()
        super.onPause()
    }

    override fun onStop() {
        networkMonitor.stop()
        super.onStop()
    }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        // Only needed if the process is killed in the background; rotation is handled
        // via configChanges and keeps the live WebView. Skip oversized history to avoid
        // TransactionTooLargeException.
        val state = Bundle()
        if (webView.saveState(state) != null && sizeOf(state) < MAX_SAVED_STATE_BYTES) {
            outState.putBundle(KEY_WEBVIEW, state)
        }
    }

    override fun onDestroy() {
        fileChooser.cancel()
        destroyWebView()
        super.onDestroy()
    }

    // --- Setup ---

    private fun createWebView() {
        webClient = StoreWebViewClient(policy, this)
        webView = WebView(this).apply {
            layoutParams = FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT,
            )
            WebViewConfigurator.configure(this)
            webViewClient = webClient
            webChromeClient = StoreChromeClient(this@MainActivity, fileChooser, this@MainActivity)
            setDownloadListener(DownloadHandler(this@MainActivity, launcher))
        }
        webContainer.addView(webView)
    }

    private fun destroyWebView() {
        if (!::webView.isInitialized) return
        webContainer.removeView(webView)
        webView.stopLoading()
        webView.webChromeClient = null
        webView.destroy()
    }

    private fun applyWindowInsets() {
        val root = findViewById<View>(R.id.root)
        ViewCompat.setOnApplyWindowInsetsListener(root) { v, insets ->
            // Keep content clear of the status bar, navigation bar, cutouts and keyboard.
            val bars = insets.getInsets(
                WindowInsetsCompat.Type.systemBars() or
                    WindowInsetsCompat.Type.displayCutout() or
                    WindowInsetsCompat.Type.ime()
            )
            v.updatePadding(left = bars.left, top = bars.top, right = bars.right, bottom = bars.bottom)
            WindowInsetsCompat.CONSUMED
        }
        val night = (resources.configuration.uiMode and Configuration.UI_MODE_NIGHT_MASK) ==
            Configuration.UI_MODE_NIGHT_YES
        WindowCompat.getInsetsController(window, window.decorView).apply {
            isAppearanceLightStatusBars = !night
            isAppearanceLightNavigationBars = !night
        }
    }

    private fun setUpSwipeRefresh() {
        swipeRefresh.isEnabled = StoreConfig.ENABLE_PULL_TO_REFRESH
        swipeRefresh.setColorSchemeResources(R.color.brand_primary)
        // Only start a refresh when the page itself is at the very top.
        swipeRefresh.setOnChildScrollUpCallback { _, _ -> webView.scrollY > 0 || errorView.isVisible }
        swipeRefresh.setOnRefreshListener {
            if (networkMonitor.isOnline()) {
                webClient.noteMainFrameRequest(webView.url)
                webView.reload()
            } else {
                swipeRefresh.isRefreshing = false
                showError(ErrorKind.CONNECTION, webView.url)
            }
        }
    }

    // --- Navigation ---

    private fun load(url: String) {
        hideError()
        webClient.noteMainFrameRequest(url)
        webView.loadUrl(url)
    }

    /** Only https store URLs from VIEW intents are accepted. */
    private fun deepLinkUrl(intent: Intent?): String? {
        if (intent?.action != Intent.ACTION_VIEW) return null
        return intent.dataString?.takeIf { policy.isAllowedInitialUrl(it) }
    }

    private fun retry() {
        val target = failedUrl ?: webView.url ?: StoreConfig.START_URL
        if (!networkMonitor.isOnline()) {
            showError(ErrorKind.CONNECTION, target)
            return
        }
        load(target)
    }

    private fun onNetworkAvailable() {
        // Connection is back while the error screen is up: try again automatically.
        if (errorView.isVisible && failedUrl != null) retry()
    }

    private val backCallback = object : OnBackPressedCallback(true) {
        override fun handleOnBackPressed() {
            if (webView.canGoBack()) {
                hideError()
                webView.goBack()
            } else {
                // Nothing left to go back to: leave the app normally.
                isEnabled = false
                onBackPressedDispatcher.onBackPressed()
                isEnabled = true
            }
        }
    }

    // --- StoreWebViewClient.Listener ---

    override fun onPageStarted(url: String) {
        hideError()
        progress.show()
    }

    override fun onPageVisible() {
        keepSplash = false
    }

    override fun onPageFinished(url: String) {
        progress.hide()
        swipeRefresh.isRefreshing = false
        keepSplash = false
    }

    override fun onMainFrameError(kind: ErrorKind, failedUrl: String?) {
        showError(kind, failedUrl)
    }

    override fun onDecision(view: WebView, decision: Decision) {
        when (decision) {
            is Decision.LoadUpgraded -> load(decision.httpsUrl)
            is Decision.OpenExternally -> launcher.openUrl(decision.url)
            is Decision.LaunchIntentUri -> launcher.openIntentUri(decision.url)?.let { fallback ->
                routeUserUrl(fallback)
            }
            Decision.LoadInApp, Decision.Block -> Unit
        }
    }

    override fun onRendererGone() {
        // The page renderer crashed or was killed for memory. Rebuild instead of crashing the app.
        val lastUrl = webView.url?.takeIf { policy.isStoreUrl(it) } ?: StoreConfig.START_URL
        destroyWebView()
        createWebView()
        load(lastUrl)
    }

    // --- StoreChromeClient.Listener ---

    override fun onProgress(progress: Int) {
        this.progress.setProgressCompat(progress, true)
        if (progress >= 100) this.progress.hide()
    }

    override fun onNewWindowUrl(url: String) {
        routeUserUrl(url)
    }

    private fun routeUserUrl(url: String) {
        when (val decision = policy.decide(url, userInitiated = true, currentUrl = webView.url)) {
            Decision.LoadInApp -> load(url)
            else -> onDecision(webView, decision)
        }
    }

    // --- Error screen ---

    private fun showError(kind: ErrorKind, url: String?) {
        failedUrl = url ?: failedUrl
        keepSplash = false
        progress.hide()
        swipeRefresh.isRefreshing = false
        val offline = kind == ErrorKind.CONNECTION && !networkMonitor.isOnline()
        errorTitle.setText(
            when {
                offline -> R.string.error_offline_title
                kind == ErrorKind.SSL -> R.string.error_ssl_title
                else -> R.string.error_generic_title
            }
        )
        errorMessage.setText(
            when {
                offline -> R.string.error_offline_message
                kind == ErrorKind.SSL -> R.string.error_ssl_message
                kind == ErrorKind.SERVER -> R.string.error_server_message
                else -> R.string.error_generic_message
            }
        )
        errorView.isVisible = true
        webView.visibility = View.INVISIBLE
    }

    private fun hideError() {
        if (!errorView.isVisible) return
        errorView.isVisible = false
        webView.visibility = View.VISIBLE
    }

    private fun sizeOf(bundle: Bundle): Int {
        val parcel = Parcel.obtain()
        return try {
            parcel.writeBundle(bundle)
            parcel.dataSize()
        } finally {
            parcel.recycle()
        }
    }

    private companion object {
        const val KEY_WEBVIEW = "webview_state"
        const val MAX_SAVED_STATE_BYTES = 300 * 1024
        const val SPLASH_TIMEOUT_MS = 2500L
    }
}
