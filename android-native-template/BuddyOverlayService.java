package com.pbg.deliverybuddy;

import android.app.ActivityManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.graphics.PixelFormat;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.os.Build;
import android.os.IBinder;
import android.os.SystemClock;
import android.provider.Settings;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.MotionEvent;
import android.view.View;
import android.view.WindowManager;
import android.widget.TextView;

public class BuddyOverlayService extends Service {

    public static final String ACTION_SHOW_BUBBLE = "com.pbg.deliverybuddy.ACTION_SHOW_BUBBLE";
    public static final String ACTION_HIDE_BUBBLE = "com.pbg.deliverybuddy.ACTION_HIDE_BUBBLE";
    public static final String ACTION_UPDATE_LISTENING = "com.pbg.deliverybuddy.ACTION_UPDATE_LISTENING";
    public static final String EXTRA_IS_LISTENING = "extra_is_listening";
    private static final String CHANNEL_ID = "delivery_buddy_overlay_channel";
    private static final int NOTIFICATION_ID = 4401;

    private WindowManager windowManager;
    private TextView bubbleView;
    private WindowManager.LayoutParams layoutParams;
    private boolean isListeningState = false;

    public static void showBubble(Context context, boolean isListening) {
        if (context == null) return;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !Settings.canDrawOverlays(context)) {
            return;
        }
        Intent svcIntent = new Intent(context, BuddyOverlayService.class);
        svcIntent.setAction(ACTION_SHOW_BUBBLE);
        svcIntent.putExtra(EXTRA_IS_LISTENING, isListening);
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(svcIntent);
            } else {
                context.startService(svcIntent);
            }
        } catch (Exception ignored) {
        }
    }

    public static void hideBubble(Context context) {
        if (context == null) return;
        Intent svcIntent = new Intent(context, BuddyOverlayService.class);
        svcIntent.setAction(ACTION_HIDE_BUBBLE);
        try {
            context.startService(svcIntent);
        } catch (Exception ignored) {
        }
    }

    public static void updateListeningState(Context context, boolean isListening) {
        if (context == null) return;
        Intent svcIntent = new Intent(context, BuddyOverlayService.class);
        svcIntent.setAction(ACTION_UPDATE_LISTENING);
        svcIntent.putExtra(EXTRA_IS_LISTENING, isListening);
        try {
            context.startService(svcIntent);
        } catch (Exception ignored) {
        }
    }

    @Override
    public void onCreate() {
        super.onCreate();
        startForegroundNotification();
        windowManager = (WindowManager) getSystemService(Context.WINDOW_SERVICE);
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null && intent.getAction() != null) {
            String action = intent.getAction();
            if (ACTION_SHOW_BUBBLE.equals(action)) {
                isListeningState = intent.getBooleanExtra(EXTRA_IS_LISTENING, isListeningState);
                showFloatingBubble();
            } else if (ACTION_HIDE_BUBBLE.equals(action)) {
                removeFloatingBubble();
            } else if (ACTION_UPDATE_LISTENING.equals(action)) {
                isListeningState = intent.getBooleanExtra(EXTRA_IS_LISTENING, false);
                updateBubbleVisualStyle();
            }
        }
        return START_STICKY;
    }

    private int dpToPx(float dp) {
        return (int) TypedValue.applyDimension(
            TypedValue.COMPLEX_UNIT_DIP,
            dp,
            getResources().getDisplayMetrics()
        );
    }

    @SuppressWarnings("deprecation")
    private void showFloatingBubble() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !Settings.canDrawOverlays(this)) {
            return;
        }
        if (bubbleView != null) {
            updateBubbleVisualStyle();
            return;
        }

        int sizePx = dpToPx(62f);
        int overlayType = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
            ? WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
            : WindowManager.LayoutParams.TYPE_PHONE;

        layoutParams = new WindowManager.LayoutParams(
            sizePx,
            sizePx,
            overlayType,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE
                | WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,
            PixelFormat.TRANSLUCENT
        );
        layoutParams.gravity = Gravity.TOP | Gravity.START;
        layoutParams.x = getResources().getDisplayMetrics().widthPixels - sizePx - dpToPx(12f);
        layoutParams.y = (int) (getResources().getDisplayMetrics().heightPixels * 0.58f);

        TextView tv = new TextView(this);
        tv.setGravity(Gravity.CENTER);
        tv.setTextSize(TypedValue.COMPLEX_UNIT_SP, 12.5f);
        tv.setTypeface(Typeface.DEFAULT_BOLD);
        tv.setIncludeFontPadding(false);
        tv.setLineSpacing(0f, 0.95f);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            tv.setElevation(dpToPx(10f));
        }

        tv.setOnTouchListener(new View.OnTouchListener() {
            private int initialX;
            private int initialY;
            private float initialTouchX;
            private float initialTouchY;
            private long touchStartTime;

            @Override
            public boolean onTouch(View v, MotionEvent event) {
                switch (event.getActionMasked()) {
                    case MotionEvent.ACTION_DOWN:
                        initialX = layoutParams.x;
                        initialY = layoutParams.y;
                        initialTouchX = event.getRawX();
                        initialTouchY = event.getRawY();
                        touchStartTime = SystemClock.uptimeMillis();
                        return true;

                    case MotionEvent.ACTION_MOVE:
                        double moveDist = Math.hypot(
                            event.getRawX() - initialTouchX,
                            event.getRawY() - initialTouchY
                        );
                        if (moveDist > 12.0) {
                            layoutParams.x = initialX + (int) (event.getRawX() - initialTouchX);
                            layoutParams.y = initialY + (int) (event.getRawY() - initialTouchY);
                            try {
                                if (windowManager != null && bubbleView != null) {
                                    windowManager.updateViewLayout(bubbleView, layoutParams);
                                }
                            } catch (Exception ignored) {
                            }
                        }
                        return true;

                    case MotionEvent.ACTION_UP:
                        double upDist = Math.hypot(
                            event.getRawX() - initialTouchX,
                            event.getRawY() - initialTouchY
                        );
                        long elapsed = SystemClock.uptimeMillis() - touchStartTime;
                        if (upDist <= 18.0 || elapsed < 220) {
                            restoreMainActivityToForeground();
                        }
                        return true;
                }
                return false;
            }
        });

        bubbleView = tv;
        updateBubbleVisualStyle();

        try {
            windowManager.addView(tv, layoutParams);
        } catch (Exception e) {
            bubbleView = null;
        }
    }

    private void restoreMainActivityToForeground() {
        removeFloatingBubble();

        // Fallback 1: ActivityManager.moveTaskToFront using MainActivity static WeakReference
        try {
            MainActivity activeInstance = MainActivity.getInstance();
            if (activeInstance != null) {
                ActivityManager am = (ActivityManager) getSystemService(Context.ACTIVITY_SERVICE);
                if (am != null) {
                    am.moveTaskToFront(activeInstance.getTaskId(), ActivityManager.MOVE_TASK_WITH_HOME);
                }
                activeInstance.notifyRestoredFromBubble();
            }
        } catch (Exception ignored) {
        }

        // Prepare Foreground Restore Intent
        Intent restoreIntent = new Intent(this, MainActivity.class);
        restoreIntent.setAction(Intent.ACTION_MAIN);
        restoreIntent.addCategory(Intent.CATEGORY_LAUNCHER);
        restoreIntent.addFlags(
            Intent.FLAG_ACTIVITY_NEW_TASK
                | Intent.FLAG_ACTIVITY_SINGLE_TOP
                | Intent.FLAG_ACTIVITY_REORDER_TO_FRONT
                | Intent.FLAG_ACTIVITY_CLEAR_TOP
        );
        restoreIntent.putExtra("RESTORE_FROM_BUBBLE", true);

        // Fallback 2: PendingIntent.send() (Bypasses Samsung One UI background activity start restrictions)
        try {
            int pendingFlags = Build.VERSION.SDK_INT >= Build.VERSION_CODES.M
                ? (PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE)
                : PendingIntent.FLAG_UPDATE_CURRENT;
            PendingIntent pi = PendingIntent.getActivity(this, 7701, restoreIntent, pendingFlags);
            pi.send();
        } catch (Exception ignored) {
        }

        // Fallback 3: Direct startActivity
        try {
            startActivity(restoreIntent);
        } catch (Exception ignored) {
        }
    }

    private void updateBubbleVisualStyle() {
        if (bubbleView == null) return;
        GradientDrawable bg = new GradientDrawable();
        bg.setShape(GradientDrawable.OVAL);
        if (isListeningState) {
            // Listening state: Vibrant Emerald Green #10b981 background, 3dp white border, bold white text "DB ON"
            bg.setColor(Color.parseColor("#10B981"));
            bg.setStroke(dpToPx(3f), Color.WHITE);
            bubbleView.setTextColor(Color.WHITE);
            bubbleView.setText("DB\nON");
        } else {
            // Idle state: Dark slate #0f172a background, 2dp emerald border, bold white text "DB" + "🎙️"
            bg.setColor(Color.parseColor("#0F172A"));
            bg.setStroke(dpToPx(2f), Color.parseColor("#10B981"));
            bubbleView.setTextColor(Color.WHITE);
            bubbleView.setText("DB\n🎙️");
        }
        bubbleView.setBackground(bg);
    }

    private void removeFloatingBubble() {
        if (bubbleView != null && windowManager != null) {
            try {
                windowManager.removeView(bubbleView);
            } catch (Exception ignored) {
            }
        }
        bubbleView = null;
    }

    @SuppressWarnings("deprecation")
    private void startForegroundNotification() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "Delivery Buddy — Copiloto de Voz & Mapa",
                NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Mantém a escuta mãos-livres 'Buddy...' e a bolinha flutuante DB sobre a Uber/Glovo.");
            channel.setShowBadge(false);
            NotificationManager nm = getSystemService(NotificationManager.class);
            if (nm != null) {
                nm.createNotificationChannel(channel);
            }
        }

        Intent openIntent = new Intent(this, MainActivity.class);
        openIntent.setAction(Intent.ACTION_MAIN);
        openIntent.addCategory(Intent.CATEGORY_LAUNCHER);
        openIntent.setFlags(
            Intent.FLAG_ACTIVITY_NEW_TASK
                | Intent.FLAG_ACTIVITY_SINGLE_TOP
                | Intent.FLAG_ACTIVITY_REORDER_TO_FRONT
                | Intent.FLAG_ACTIVITY_CLEAR_TOP
        );
        openIntent.putExtra("RESTORE_FROM_BUBBLE", true);

        int pendingFlags = Build.VERSION.SDK_INT >= Build.VERSION_CODES.M
            ? (PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE)
            : PendingIntent.FLAG_UPDATE_CURRENT;

        PendingIntent pendingIntent = PendingIntent.getActivity(this, 7702, openIntent, pendingFlags);

        Notification.Builder builder = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
            ? new Notification.Builder(this, CHANNEL_ID)
            : new Notification.Builder(this);

        Notification notification = builder
            .setContentTitle("Delivery Buddy Ativo (Amarante)")
            .setContentText("Bolinha DB & Voz 'Buddy...' ativas • Toque para abrir")
            .setSmallIcon(android.R.drawable.ic_btn_speak_now)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .build();

        startForeground(NOTIFICATION_ID, notification);
    }

    @Override
    public void onDestroy() {
        removeFloatingBubble();
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
