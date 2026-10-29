package com.wfcostore.app.web

import android.app.Activity
import android.content.ActivityNotFoundException
import android.content.Intent
import android.net.Uri
import android.webkit.ValueCallback
import android.webkit.WebChromeClient.FileChooserParams
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.result.contract.ActivityResultContracts
import com.wfcostore.app.R

/**
 * Backs <input type="file"> with the system document picker. No storage or
 * camera permission is needed: the picker grants access to the chosen files only.
 *
 * Must be created before the activity is STARTED (i.e. in onCreate).
 */
class FileChooserHandler(private val activity: ComponentActivity) {

    private var pending: ValueCallback<Array<Uri>>? = null

    private val launcher = activity.registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        val callback = pending ?: return@registerForActivityResult
        pending = null
        callback.onReceiveValue(parse(result.resultCode, result.data))
    }

    fun show(callback: ValueCallback<Array<Uri>>, params: FileChooserParams): Boolean {
        // A previous request must be answered or WebView never opens the picker again.
        pending?.onReceiveValue(null)
        pending = callback

        val intent = params.createIntent().apply {
            addCategory(Intent.CATEGORY_OPENABLE)
            if (params.mode == FileChooserParams.MODE_OPEN_MULTIPLE) {
                putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true)
            }
        }
        return try {
            launcher.launch(intent)
            true
        } catch (e: ActivityNotFoundException) {
            pending = null
            callback.onReceiveValue(null)
            Toast.makeText(activity, R.string.no_app_to_open, Toast.LENGTH_SHORT).show()
            true
        }
    }

    /** Releases a waiting callback, e.g. when the WebView is destroyed. */
    fun cancel() {
        pending?.onReceiveValue(null)
        pending = null
    }

    private fun parse(resultCode: Int, data: Intent?): Array<Uri>? {
        if (resultCode != Activity.RESULT_OK || data == null) return null
        val clip = data.clipData
        if (clip != null && clip.itemCount > 0) {
            return Array(clip.itemCount) { clip.getItemAt(it).uri }
        }
        return FileChooserParams.parseResult(resultCode, data)
    }
}
