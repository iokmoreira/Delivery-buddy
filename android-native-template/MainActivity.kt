package com.pbg.deliverybuddy

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import android.view.WindowManager
import android.webkit.JavascriptInterface
import android.webkit.PermissionRequest
import android.webkit.WebChromeClient
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import com.getcapacitor.BridgeActivity

/**
 * MainActivity for Delivery Buddy (com.pbg.deliverybuddy)
 * Exposes @JavascriptInterface `window.BuddyNativeOverlay` for:
 *  - minimizeToFloatingBubble(): shows 56dp native DB bubble & moves WebView Activity to back so Uber Eats / Glovo are 100% touchable underneath.
 *  - maximizeFromBubble(): hides native bubble & brings MainActivity immediately to foreground (FLAG_ACTIVITY_REORDER_TO_FRONT).
 *  - setBubbleListeningState(boolean): turns the 56dp DB bubble vibrant Emerald Green (#10b981) when listening.
 */
class MainActivity : BridgeActivity() {

    private var isMicListening: Boolean = true

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Keep screen on while mounted on motorcycle handlebar
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)

        requestRuntimePermissionsIfNeeded()

        // Register JavascriptInterface on Capacitor WebView
        bridge?.webView?.let { webView ->
            webView.settings.javaScriptEnabled = true
            webView.settings.mediaPlaybackRequiresUserGesture = false
            webView.addJavascriptInterface(BuddyNativeOverlayBridge(), "BuddyNativeOverlay")

            webView.webChromeClient = object : WebChromeClient() {
                override fun onPermissionRequest(request: PermissionRequest?) {
                    request?.grant(request.resources)
                }
            }
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        if (intent.getBooleanExtra("RESTORE_FROM_BUBBLE", false)) {
            hideOverlayBubbleService()
            bridge?.webView?.post {
                bridge?.webView?.evaluateJavascript(
                    "window.__onNativeBubbleRestore && window.__onNativeBubbleRestore();",
                    null
                )
            }
        }
    }

    override fun onResume() {
        super.onResume()
        hideOverlayBubbleService()
    }

    private fun requestRuntimePermissionsIfNeeded() {
        val needed = mutableListOf(
            Manifest.permission.RECORD_AUDIO,
            Manifest.permission.ACCESS_FINE_LOCATION,
            Manifest.permission.ACCESS_COARSE_LOCATION
        )
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            needed.add(Manifest.permission.POST_NOTIFICATIONS)
        }
        val missing = needed.filter {
            ContextCompat.checkSelfPermission(this, it) != PackageManager.PERMISSION_GRANTED
        }
        if (missing.isNotEmpty()) {
            ActivityCompat.requestPermissions(this, missing.toTypedArray(), 9101)
        }
    }

    private fun ensureOverlayPermission(): Boolean {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !Settings.canDrawOverlays(this)) {
            val intent = Intent(
                Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                Uri.parse("package:$packageName")
            )
            startActivity(intent)
            return false
        }
        return true
    }

    private fun showOverlayBubbleService() {
        val svcIntent = Intent(this, BuddyOverlayService::class.java).apply {
            action = BuddyOverlayService.ACTION_SHOW_BUBBLE
            putExtra(BuddyOverlayService.EXTRA_IS_LISTENING, isMicListening)
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(svcIntent)
        } else {
            startService(svcIntent)
        }
    }

    private fun hideOverlayBubbleService() {
        val svcIntent = Intent(this, BuddyOverlayService::class.java).apply {
            action = BuddyOverlayService.ACTION_HIDE_BUBBLE
        }
        startService(svcIntent)
    }

    inner class BuddyNativeOverlayBridge {

        @JavascriptInterface
        fun minimizeToFloatingBubble() {
            runOnUiThread {
                if (ensureOverlayPermission()) {
                    showOverlayBubbleService()
                    moveTaskToBack(true)
                }
            }
        }

        @JavascriptInterface
        fun maximizeFromBubble() {
            runOnUiThread {
                hideOverlayBubbleService()
                val bringFrontIntent = Intent(this@MainActivity, MainActivity::class.java).apply {
                    addFlags(
                        Intent.FLAG_ACTIVITY_NEW_TASK or
                            Intent.FLAG_ACTIVITY_REORDER_TO_FRONT or
                            Intent.FLAG_ACTIVITY_SINGLE_TOP
                    )
                    putExtra("RESTORE_FROM_BUBBLE", true)
                }
                startActivity(bringFrontIntent)
            }
        }

        @JavascriptInterface
        fun setBubbleListeningState(listening: Boolean) {
            isMicListening = listening
            runOnUiThread {
                val svcIntent = Intent(this@MainActivity, BuddyOverlayService::class.java).apply {
                    action = BuddyOverlayService.ACTION_UPDATE_LISTENING
                    putExtra(BuddyOverlayService.EXTRA_IS_LISTENING, listening)
                }
                startService(svcIntent)
            }
        }
    }
}
