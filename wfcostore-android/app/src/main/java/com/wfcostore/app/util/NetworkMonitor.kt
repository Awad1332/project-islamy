package com.wfcostore.app.util

import android.content.Context
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import android.os.Handler
import android.os.Looper

/** Reports when connectivity comes back so a failed page can reload by itself. */
class NetworkMonitor(context: Context, private val onAvailable: () -> Unit) {

    private val connectivity = context.getSystemService(ConnectivityManager::class.java)
    private val mainHandler = Handler(Looper.getMainLooper())
    private var registered = false

    private val callback = object : ConnectivityManager.NetworkCallback() {
        override fun onAvailable(network: Network) {
            mainHandler.post { onAvailable() }
        }
    }

    fun isOnline(): Boolean {
        val caps = connectivity?.getNetworkCapabilities(connectivity.activeNetwork) ?: return false
        return caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
    }

    fun start() {
        if (registered || connectivity == null) return
        try {
            connectivity.registerDefaultNetworkCallback(callback)
            registered = true
        } catch (e: RuntimeException) {
            // Too many callbacks registered system-wide; auto-retry is a convenience only.
        }
    }

    fun stop() {
        if (!registered) return
        registered = false
        mainHandler.removeCallbacksAndMessages(null)
        try {
            connectivity?.unregisterNetworkCallback(callback)
        } catch (e: IllegalArgumentException) {
            // Already unregistered.
        }
    }
}
