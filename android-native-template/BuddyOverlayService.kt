package com.pbg.deliverybuddy

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.graphics.PixelFormat
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.os.Build
import android.os.IBinder
import android.provider.Settings
import android.util.TypedValue
import android.view.Gravity
import android.view.MotionEvent
import android.view.View
import android.view.WindowManager
import android.widget.TextView
import kotlin.math.abs

/**
 * Native Android System Overlay Service ("DB" 56dp Floating Bubble)
 * Renders a draggable circular bubble over Uber Eats / Glovo / Bolt Food when Delivery Buddy is minimized.
 * Turns vibrant Emerald Green (#10b981) when continuous VAD voice listening is active.
 */
class BuddyOverlayService : Service() {

    companion object {
        const val ACTION_SHOW_BUBBLE = "com.pbg.deliverybuddy.ACTION_SHOW_BUBBLE"
        const val ACTION_HIDE_BUBBLE = "com.pbg.deliverybuddy.ACTION_HIDE_BUBBLE"
        const val ACTION_UPDATE_LISTENING = "com.pbg.deliverybuddy.ACTION_UPDATE_LISTENING"
        const val EXTRA_IS_LISTENING = "extra_is_listening"
        private const val CHANNEL_ID = "delivery_buddy_overlay_channel"
        private const val NOTIFICATION_ID = 4401
    }

    private var windowManager: WindowManager? = null
    private var bubbleView: TextView? = null
    private var layoutParams: WindowManager.LayoutParams? = null
    private var isListeningState: Boolean = true

    override fun onCreate() {
        super.onCreate()
        startForegroundNotification()
        windowManager = getSystemService(Context.WINDOW_SERVICE) as WindowManager
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_SHOW_BUBBLE -> {
                isListeningState = intent.getBooleanExtra(EXTRA_IS_LISTENING, isListeningState)
                showFloatingBubble()
            }
            ACTION_HIDE_BUBBLE -> {
                removeFloatingBubble()
            }
            ACTION_UPDATE_LISTENING -> {
                isListeningState = intent.getBooleanExtra(EXTRA_IS_LISTENING, true)
                updateBubbleVisualStyle()
            }
        }
        return START_STICKY
    }

    private fun dpToPx(dp: Float): Int {
        return TypedValue.applyDimension(
            TypedValue.COMPLEX_UNIT_DIP,
            dp,
            resources.displayMetrics
        ).toInt()
    }

    private fun showFloatingBubble() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !Settings.canDrawOverlays(this)) {
            return
        }
        if (bubbleView != null) {
            updateBubbleVisualStyle()
            return
        }

        val sizePx = dpToPx(56f)
        val overlayType = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
        } else {
            @Suppress("DEPRECATION")
            WindowManager.LayoutParams.TYPE_PHONE
        }

        val params = WindowManager.LayoutParams(
            sizePx,
            sizePx,
            overlayType,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
                WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,
            PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.TOP or Gravity.START
            x = resources.displayMetrics.widthPixels - sizePx - dpToPx(12f)
            y = (resources.displayMetrics.heightPixels * 0.65f).toInt()
        }
        layoutParams = params

        val tv = TextView(this).apply {
            text = "DB"
            gravity = Gravity.CENTER
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 15f)
            setTypeface(typeface, Typeface.BOLD)
            elevation = dpToPx(8f).toFloat()
        }

        var initialX = 0
        var initialY = 0
        var initialTouchX = 0f
        var initialTouchY = 0f

        tv.setOnTouchListener { _: View, event: MotionEvent ->
            when (event.action) {
                MotionEvent.ACTION_DOWN -> {
                    initialX = params.x
                    initialY = params.y
                    initialTouchX = event.rawX
                    initialTouchY = event.rawY
                    true
                }
                MotionEvent.ACTION_MOVE -> {
                    params.x = initialX + (event.rawX - initialTouchX).toInt()
                    params.y = initialY + (event.rawY - initialTouchY).toInt()
                    try {
                        windowManager?.updateViewLayout(tv, params)
                    } catch (_: Exception) {
                    }
                    true
                }
                MotionEvent.ACTION_UP -> {
                    val dx = abs(event.rawX - initialTouchX)
                    val dy = abs(event.rawY - initialTouchY)
                    if (dx < dpToPx(8f) && dy < dpToPx(8f)) {
                        // Single tap on floating DB bubble: restore MainActivity to foreground
                        removeFloatingBubble()
                        val restoreIntent = Intent(this@BuddyOverlayService, MainActivity::class.java).apply {
                            addFlags(
                                Intent.FLAG_ACTIVITY_NEW_TASK or
                                    Intent.FLAG_ACTIVITY_REORDER_TO_FRONT or
                                    Intent.FLAG_ACTIVITY_SINGLE_TOP
                            )
                            putExtra("RESTORE_FROM_BUBBLE", true)
                        }
                        startActivity(restoreIntent)
                    }
                    true
                }
                else -> false
            }
        }

        bubbleView = tv
        updateBubbleVisualStyle()

        try {
            windowManager?.addView(tv, params)
        } catch (_: Exception) {
            bubbleView = null
        }
    }

    private fun updateBubbleVisualStyle() {
        val tv = bubbleView ?: return
        val bg = GradientDrawable().apply {
            shape = GradientDrawable.OVAL
            if (isListeningState) {
                // Vibrant Emerald Green (#10b981) when Continuous Voice VAD is active
                setColor(Color.parseColor("#10B981"))
                setStroke(dpToPx(2.5f), Color.parseColor("#A7F3D0"))
            } else {
                setColor(Color.parseColor("#0F172A"))
                setStroke(dpToPx(2f), Color.parseColor("#10B981"))
            }
        }
        tv.background = bg
        tv.setTextColor(if (isListeningState) Color.parseColor("#022C22") else Color.WHITE)
        tv.text = if (isListeningState) "🎙️DB" else "DB"
    }

    private fun removeFloatingBubble() {
        bubbleView?.let { view ->
            try {
                windowManager?.removeView(view)
            } catch (_: Exception) {
            }
        }
        bubbleView = null
    }

    private fun startForegroundNotification() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Delivery Buddy — Copiloto de Voz & Mapa",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Mantém a escuta mãos-livres 'Buddy...' e a bolinha flutuante sobre a Uber/Glovo."
                setShowBadge(false)
            }
            val nm = getSystemService(NotificationManager::class.java)
            nm?.createNotificationChannel(channel)
        }

        val openIntent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_REORDER_TO_FRONT
            putExtra("RESTORE_FROM_BUBBLE", true)
        }
        val pendingFlags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        } else {
            PendingIntent.FLAG_UPDATE_CURRENT
        }
        val pendingIntent = PendingIntent.getActivity(this, 0, openIntent, pendingFlags)

        val builder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            Notification.Builder(this, CHANNEL_ID)
        } else {
            @Suppress("DEPRECATION")
            Notification.Builder(this)
        }

        val notification = builder
            .setContentTitle("Delivery Buddy Ativo (Amarante)")
            .setContentText("Escuta 'Buddy...' ativa • Toque para abrir ecrã inteiro")
            .setSmallIcon(android.R.drawable.ic_btn_speak_now)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .build()

        startForeground(NOTIFICATION_ID, notification)
    }

    override fun onDestroy() {
        removeFloatingBubble()
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null
}
