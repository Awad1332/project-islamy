package com.wfcostore.app.util

import android.os.SystemClock

/**
 * Swallows repeated triggers (double taps on a WhatsApp button, a retry button
 * hammered while offline) so they do not open the same screen twice.
 */
class ClickGuard(private val windowMs: Long = 1000L) {
    private var lastKey: String? = null
    private var lastAt = 0L

    /** Returns true when the action should run. */
    fun allow(key: String = ""): Boolean {
        val now = SystemClock.elapsedRealtime()
        if (key == lastKey && now - lastAt < windowMs) return false
        lastKey = key
        lastAt = now
        return true
    }
}
