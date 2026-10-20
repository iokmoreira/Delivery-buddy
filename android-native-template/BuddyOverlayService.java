package com.pbg.deliverybuddy;

import android.app.ActivityManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.BitmapShader;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Matrix;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.PixelFormat;
import android.graphics.RectF;
import android.graphics.Shader;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.SystemClock;
import android.provider.Settings;
import android.util.Base64;
import android.util.DisplayMetrics;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.HapticFeedbackConstants;
import android.view.MotionEvent;
import android.view.View;
import android.view.WindowManager;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.TextView;

public class BuddyOverlayService extends Service {

    public static final String ACTION_SHOW_BUBBLE = "com.pbg.deliverybuddy.ACTION_SHOW_BUBBLE";
    public static final String ACTION_HIDE_BUBBLE = "com.pbg.deliverybuddy.ACTION_HIDE_BUBBLE";
    public static final String ACTION_UPDATE_LISTENING = "com.pbg.deliverybuddy.ACTION_UPDATE_LISTENING";
    public static final String ACTION_WAKE_AND_MAXIMIZE = "com.pbg.deliverybuddy.ACTION_WAKE_AND_MAXIMIZE";
    public static final String ACTION_REFRESH_MASCOT_OR_PRESET = "com.pbg.deliverybuddy.ACTION_REFRESH_MASCOT_OR_PRESET";
    public static final String EXTRA_IS_LISTENING = "extra_is_listening";
    public static final String EXTRA_LIVE_CAPTION = "extra_live_caption";

    private static final String PREFS_NAME = "buddy_overlay_prefs";
    private static final String KEY_MASCOT_INACTIVE = "mascot_inactive_b64";
    private static final String KEY_MASCOT_ACTIVE = "mascot_active_b64";
    private static final String KEY_MASCOT_DELIVERY = "mascot_delivery_b64";
    private static final String KEY_MASCOT_STATE = "mascot_current_state";
    private static final String KEY_RESTING_PRESET = "bubble_resting_preset";
    private static final String KEY_CUSTOM_X = "bubble_custom_x";
    private static final String KEY_CUSTOM_Y = "bubble_custom_y";

    private static final String CHANNEL_ID = "delivery_buddy_overlay_channel";
    private static final int NOTIFICATION_ID = 4401;

    private final Handler uiHandler = new Handler(Looper.getMainLooper());
    private WindowManager windowManager;
    private FrameLayout bubbleContainer;
    private ImageView mascotImageView;
    private TextView badgeCaptionView;
    private WindowManager.LayoutParams layoutParams;
    private boolean isListeningState = false;
    private String liveCaptionText = "";

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
        updateListeningStateWithCaption(context, isListening, "");
    }

    public static void updateListeningStateWithCaption(Context context, boolean isListening, String caption) {
        if (context == null) return;
        Intent svcIntent = new Intent(context, BuddyOverlayService.class);
        svcIntent.setAction(ACTION_UPDATE_LISTENING);
        svcIntent.putExtra(EXTRA_IS_LISTENING, isListening);
        svcIntent.putExtra(EXTRA_LIVE_CAPTION, caption != null ? caption : "");
        try {
            context.startService(svcIntent);
        } catch (Exception ignored) {
        }
    }

    public static void setBubbleMascotImages(
        Context context,
        String inactiveB64,
        String activeB64,
        String deliveryB64
    ) {
        if (context == null) return;
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        prefs.edit()
            .putString(KEY_MASCOT_INACTIVE, inactiveB64 != null ? inactiveB64 : "")
            .putString(KEY_MASCOT_ACTIVE, activeB64 != null ? activeB64 : "")
            .putString(KEY_MASCOT_DELIVERY, deliveryB64 != null ? deliveryB64 : "")
            .apply();
        triggerRefreshIfRunning(context);
    }

    public static void setBubbleMascotState(Context context, String state) {
        if (context == null || state == null) return;
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        prefs.edit().putString(KEY_MASCOT_STATE, state.trim().toUpperCase()).apply();
        triggerRefreshIfRunning(context);
    }

    public static void setBubbleRestingPreset(Context context, String preset) {
        if (context == null || preset == null) return;
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        prefs.edit().putString(KEY_RESTING_PRESET, preset.trim().toUpperCase()).apply();
        triggerRefreshIfRunning(context);
    }

    private static void triggerRefreshIfRunning(Context context) {
        try {
            Intent svcIntent = new Intent(context, BuddyOverlayService.class);
            svcIntent.setAction(ACTION_REFRESH_MASCOT_OR_PRESET);
            context.startService(svcIntent);
        } catch (Exception ignored) {
        }
    }

    public static void wakeAndMaximizeActivity(Context context) {
        if (context == null) return;
        Intent svcIntent = new Intent(context, BuddyOverlayService.class);
        svcIntent.setAction(ACTION_WAKE_AND_MAXIMIZE);
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
                MainActivity act = MainActivity.getInstance();
                if (act != null && act.isActivityInForeground()) {
                    removeFloatingBubble();
                    return START_STICKY;
                }
                isListeningState = intent.getBooleanExtra(EXTRA_IS_LISTENING, false);
                liveCaptionText = "";
                showFloatingBubble();
            } else if (ACTION_HIDE_BUBBLE.equals(action)) {
                removeFloatingBubble();
            } else if (ACTION_UPDATE_LISTENING.equals(action)) {
                MainActivity act = MainActivity.getInstance();
                if (act != null && act.isActivityInForeground()) {
                    removeFloatingBubble();
                    return START_STICKY;
                }
                isListeningState = intent.getBooleanExtra(EXTRA_IS_LISTENING, false);
                liveCaptionText = intent.getStringExtra(EXTRA_LIVE_CAPTION);
                if (liveCaptionText == null) liveCaptionText = "";
                if (bubbleContainer != null) {
                    updateBubbleVisualStyle();
                }
            } else if (ACTION_REFRESH_MASCOT_OR_PRESET.equals(action)) {
                MainActivity act = MainActivity.getInstance();
                if (act != null && act.isActivityInForeground()) {
                    removeFloatingBubble();
                    return START_STICKY;
                }
                if (bubbleContainer != null) {
                    snapBubbleToConfiguredRestingPosition();
                    updateBubbleVisualStyle();
                }
            } else if (ACTION_WAKE_AND_MAXIMIZE.equals(action)) {
                restoreMainActivityToForeground();
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

    private int[] computeRestingXY(int sizePx) {
        DisplayMetrics dm = getResources().getDisplayMetrics();
        int screenW = dm.widthPixels;
        int screenH = dm.heightPixels;

        // Default ergonomic Bottom-Right position: right edge x = screenWidth - dp(68), bottom y = screenHeight - dp(190)
        int defaultRightX = Math.max(dpToPx(8f), screenW - sizePx - dpToPx(10f));
        int defaultLeftX = dpToPx(10f);
        int defaultBottomY = Math.max(dpToPx(40f), screenH - dpToPx(190f));
        int defaultMiddleY = (int) (screenH * 0.48f);

        SharedPreferences prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        String preset = prefs.getString(KEY_RESTING_PRESET, "BOTTOM_RIGHT");
        if (preset == null) preset = "BOTTOM_RIGHT";

        if ("BOTTOM_LEFT".equals(preset)) {
            return new int[] { defaultLeftX, defaultBottomY };
        } else if ("MIDDLE_RIGHT".equals(preset)) {
            return new int[] { defaultRightX, defaultMiddleY };
        } else if ("MIDDLE_LEFT".equals(preset)) {
            return new int[] { defaultLeftX, defaultMiddleY };
        } else if ("CUSTOM_DRAG".equals(preset)) {
            int cx = prefs.getInt(KEY_CUSTOM_X, defaultRightX);
            int cy = prefs.getInt(KEY_CUSTOM_Y, defaultBottomY);
            cx = Math.max(0, Math.min(screenW - sizePx, cx));
            cy = Math.max(0, Math.min(screenH - sizePx, cy));
            return new int[] { cx, cy };
        }
        return new int[] { defaultRightX, defaultBottomY };
    }

    private void snapBubbleToConfiguredRestingPosition() {
        if (layoutParams == null) return;
        int sizePx = dpToPx(64f);
        int[] xy = computeRestingXY(sizePx);
        layoutParams.x = xy[0];
        layoutParams.y = xy[1];
        if (windowManager != null && bubbleContainer != null) {
            try {
                windowManager.updateViewLayout(bubbleContainer, layoutParams);
            } catch (Exception ignored) {
            }
        }
    }

    @SuppressWarnings("deprecation")
    private void showFloatingBubble() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !Settings.canDrawOverlays(this)) {
            return;
        }
        if (bubbleContainer != null) {
            snapBubbleToConfiguredRestingPosition();
            updateBubbleVisualStyle();
            return;
        }

        int sizePx = dpToPx(64f);
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
        int[] restingXY = computeRestingXY(sizePx);
        layoutParams.x = restingXY[0];
        layoutParams.y = restingXY[1];

        final FrameLayout container = new FrameLayout(this);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            container.setElevation(dpToPx(12f));
        }

        mascotImageView = new ImageView(this);
        mascotImageView.setScaleType(ImageView.ScaleType.FIT_CENTER);
        FrameLayout.LayoutParams imgLp = new FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.MATCH_PARENT,
            FrameLayout.LayoutParams.MATCH_PARENT
        );
        container.addView(mascotImageView, imgLp);

        badgeCaptionView = new TextView(this);
        badgeCaptionView.setGravity(Gravity.CENTER);
        badgeCaptionView.setTextSize(TypedValue.COMPLEX_UNIT_SP, 9f);
        badgeCaptionView.setTypeface(Typeface.DEFAULT_BOLD);
        badgeCaptionView.setTextColor(Color.WHITE);
        badgeCaptionView.setIncludeFontPadding(false);
        FrameLayout.LayoutParams badgeLp = new FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.WRAP_CONTENT,
            FrameLayout.LayoutParams.WRAP_CONTENT,
            Gravity.BOTTOM | Gravity.CENTER_HORIZONTAL
        );
        badgeLp.bottomMargin = dpToPx(2f);
        container.addView(badgeCaptionView, badgeLp);

        container.setOnTouchListener(new View.OnTouchListener() {
            private int initialX;
            private int initialY;
            private float initialTouchX;
            private float initialTouchY;
            private long touchStartTime;
            private boolean longPressTriggered = false;

            private final Runnable longPressRunnable = new Runnable() {
                @Override
                public void run() {
                    longPressTriggered = true;
                    try {
                        container.performHapticFeedback(HapticFeedbackConstants.LONG_PRESS);
                    } catch (Exception ignored) {
                    }
                    isListeningState = true;
                    liveCaptionText = "Ouvindo...";
                    updateBubbleVisualStyle();
                    MainActivity activeInstance = MainActivity.getInstance();
                    if (activeInstance != null) {
                        activeInstance.startSingleShotVoiceFromOverlay();
                    }
                }
            };

            @Override
            public boolean onTouch(View v, MotionEvent event) {
                switch (event.getActionMasked()) {
                    case MotionEvent.ACTION_DOWN:
                        initialX = layoutParams.x;
                        initialY = layoutParams.y;
                        initialTouchX = event.getRawX();
                        initialTouchY = event.getRawY();
                        touchStartTime = SystemClock.uptimeMillis();
                        longPressTriggered = false;
                        uiHandler.removeCallbacks(longPressRunnable);
                        uiHandler.postDelayed(longPressRunnable, 380L);
                        return true;

                    case MotionEvent.ACTION_MOVE:
                        double moveDist = Math.hypot(
                            event.getRawX() - initialTouchX,
                            event.getRawY() - initialTouchY
                        );
                        if (moveDist > 14.0) {
                            uiHandler.removeCallbacks(longPressRunnable);
                            layoutParams.x = initialX + (int) (event.getRawX() - initialTouchX);
                            layoutParams.y = initialY + (int) (event.getRawY() - initialTouchY);
                            try {
                                if (windowManager != null && bubbleContainer != null) {
                                    windowManager.updateViewLayout(bubbleContainer, layoutParams);
                                }
                            } catch (Exception ignored) {
                            }
                        }
                        return true;

                    case MotionEvent.ACTION_UP:
                    case MotionEvent.ACTION_CANCEL:
                        uiHandler.removeCallbacks(longPressRunnable);
                        double upDist = Math.hypot(
                            event.getRawX() - initialTouchX,
                            event.getRawY() - initialTouchY
                        );
                        long elapsed = SystemClock.uptimeMillis() - touchStartTime;
                        if (upDist >= 18.0) {
                            // Save dragged position for CUSTOM_DRAG preset
                            SharedPreferences prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
                            prefs.edit()
                                .putInt(KEY_CUSTOM_X, layoutParams.x)
                                .putInt(KEY_CUSTOM_Y, layoutParams.y)
                                .apply();
                        } else if (!longPressTriggered && elapsed < 380L) {
                            // Short tap (< 380ms, movement < 18px) -> 1-Tap Maximize!
                            restoreMainActivityToForeground();
                        }
                        return true;
                }
                return false;
            }
        });

        bubbleContainer = container;
        updateBubbleVisualStyle();

        try {
            windowManager.addView(container, layoutParams);
        } catch (Exception e) {
            bubbleContainer = null;
        }
    }

    private void restoreMainActivityToForeground() {
        // Immediately remove the native overlay bubble so two bubbles never appear simultaneously
        removeFloatingBubble();

        try {
            MainActivity activeInstance = MainActivity.getInstance();
            if (activeInstance != null) {
                if (activeInstance.isActivityInForeground()) {
                    return;
                }
                ActivityManager am = (ActivityManager) getSystemService(Context.ACTIVITY_SERVICE);
                if (am != null) {
                    am.moveTaskToFront(activeInstance.getTaskId(), ActivityManager.MOVE_TASK_WITH_HOME);
                }
                activeInstance.notifyRestoredFromBubble();
            }
        } catch (Exception ignored) {
        }

        Intent restoreIntent = new Intent(this, MainActivity.class);
        restoreIntent.setAction(Intent.ACTION_MAIN);
        restoreIntent.addCategory(Intent.CATEGORY_LAUNCHER);
        restoreIntent.addFlags(
            Intent.FLAG_ACTIVITY_NEW_TASK
                | Intent.FLAG_ACTIVITY_SINGLE_TOP
                | Intent.FLAG_ACTIVITY_REORDER_TO_FRONT
        );
        restoreIntent.putExtra("RESTORE_FROM_BUBBLE", true);

        try {
            int pendingFlags = Build.VERSION.SDK_INT >= Build.VERSION_CODES.M
                ? (PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE)
                : PendingIntent.FLAG_UPDATE_CURRENT;
            PendingIntent pi = PendingIntent.getActivity(this, 7701, restoreIntent, pendingFlags);
            pi.send();
        } catch (Exception ignored) {
        }

        try {
            startActivity(restoreIntent);
        } catch (Exception ignored) {
        }
    }

    private void updateBubbleVisualStyle() {
        if (bubbleContainer == null || mascotImageView == null || badgeCaptionView == null) return;

        SharedPreferences prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        String state = prefs.getString(KEY_MASCOT_STATE, "ACTIVE");
        if (state == null) state = "ACTIVE";

        String b64 = "";
        int ringColor = Color.parseColor("#10B981"); // Default Emerald for ACTIVE
        if ("INACTIVE".equals(state)) {
            b64 = prefs.getString(KEY_MASCOT_INACTIVE, "");
            ringColor = Color.parseColor("#94A3B8");
        } else if ("DELIVERY".equals(state)) {
            b64 = prefs.getString(KEY_MASCOT_DELIVERY, "");
            ringColor = Color.parseColor("#F59E0B");
        } else {
            b64 = prefs.getString(KEY_MASCOT_ACTIVE, "");
            ringColor = Color.parseColor("#10B981");
        }

        if (isListeningState) {
            ringColor = Color.WHITE;
        }

        int sizePx = dpToPx(64f);
        Bitmap avatarBmp = decodeCustomOrDrawBuiltinMascot(b64, state, sizePx, ringColor);
        mascotImageView.setImageBitmap(avatarBmp);

        GradientDrawable pillBg = new GradientDrawable();
        pillBg.setCornerRadius(dpToPx(8f));

        if (isListeningState) {
            pillBg.setColor(Color.parseColor("#059669"));
            pillBg.setStroke(dpToPx(1f), Color.WHITE);
            String shortCap = liveCaptionText != null ? liveCaptionText.trim() : "";
            if (shortCap.length() > 9) {
                shortCap = shortCap.substring(Math.max(0, shortCap.length() - 9));
            }
            badgeCaptionView.setText(shortCap.isEmpty() ? "🎙️ VOZ" : "🎙️ " + shortCap);
            badgeCaptionView.setPadding(dpToPx(5f), dpToPx(1.5f), dpToPx(5f), dpToPx(1.5f));
            badgeCaptionView.setBackground(pillBg);
            badgeCaptionView.setVisibility(View.VISIBLE);
        } else {
            pillBg.setColor(Color.parseColor("#0F172A"));
            pillBg.setStroke(dpToPx(1f), ringColor);
            String badgeTxt = "DELIVERY".equals(state)
                ? "🚀 ROTA"
                : "INACTIVE".equals(state)
                    ? "⚪ PAUSA"
                    : "DB 👍";
            badgeCaptionView.setText(badgeTxt);
            badgeCaptionView.setPadding(dpToPx(5f), dpToPx(1f), dpToPx(5f), dpToPx(1f));
            badgeCaptionView.setBackground(pillBg);
            badgeCaptionView.setVisibility(View.VISIBLE);
        }
    }

    private Bitmap decodeCustomOrDrawBuiltinMascot(
        String dataUrlOrB64,
        String state,
        int sizePx,
        int borderColor
    ) {
        Bitmap out = Bitmap.createBitmap(sizePx, sizePx, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(out);
        float half = sizePx / 2f;
        float strokeW = dpToPx(3f);
        float radius = half - strokeW;

        Paint bgPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        bgPaint.setStyle(Paint.Style.FILL);
        bgPaint.setColor(isListeningState ? Color.parseColor("#065F46") : Color.parseColor("#0F172A"));
        canvas.drawCircle(half, half, radius, bgPaint);

        boolean drewCustom = false;
        if (dataUrlOrB64 != null && !dataUrlOrB64.trim().isEmpty()) {
            try {
                String cleanB64 = dataUrlOrB64.trim();
                int commaIdx = cleanB64.indexOf(',');
                if (commaIdx >= 0) {
                    cleanB64 = cleanB64.substring(commaIdx + 1);
                }
                byte[] bytes = Base64.decode(cleanB64, Base64.DEFAULT);
                Bitmap rawBmp = BitmapFactory.decodeByteArray(bytes, 0, bytes.length);
                if (rawBmp != null) {
                    BitmapShader shader = new BitmapShader(rawBmp, Shader.TileMode.CLAMP, Shader.TileMode.CLAMP);
                    Matrix m = new Matrix();
                    float scale = (float) sizePx / (float) Math.min(rawBmp.getWidth(), rawBmp.getHeight());
                    m.setScale(scale, scale);
                    m.postTranslate(
                        (sizePx - rawBmp.getWidth() * scale) / 2f,
                        (sizePx - rawBmp.getHeight() * scale) / 2f
                    );
                    shader.setLocalMatrix(m);
                    Paint imgPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
                    imgPaint.setShader(shader);
                    canvas.drawCircle(half, half, radius - 1f, imgPaint);
                    drewCustom = true;
                }
            } catch (Exception ignored) {
            }
        }

        if (!drewCustom) {
            drawBuiltinRobotMascotOnCanvas(canvas, sizePx, state);
        }

        Paint borderPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        borderPaint.setStyle(Paint.Style.STROKE);
        borderPaint.setStrokeWidth(strokeW);
        borderPaint.setColor(borderColor);
        canvas.drawCircle(half, half, radius, borderPaint);

        return out;
    }

    private void drawBuiltinRobotMascotOnCanvas(Canvas canvas, int sizePx, String state) {
        float s = sizePx / 100f;
        Paint p = new Paint(Paint.ANTI_ALIAS_FLAG);

        if ("INACTIVE".equals(state)) {
            // Pose 2: Robot turned from behind showing green DB BUDDY backpack
            p.setStyle(Paint.Style.FILL);
            // Back of robot helmet
            p.setColor(Color.parseColor("#CBD5E1"));
            canvas.drawRoundRect(new RectF(30 * s, 16 * s, 70 * s, 46 * s), 14 * s, 14 * s, p);
            // Prominent Green DB Backpack
            p.setColor(Color.parseColor("#10B981"));
            canvas.drawRoundRect(new RectF(26 * s, 40 * s, 74 * s, 82 * s), 10 * s, 10 * s, p);
            // Dark emblem on backpack
            p.setColor(Color.parseColor("#064E3B"));
            canvas.drawRoundRect(new RectF(34 * s, 48 * s, 66 * s, 70 * s), 6 * s, 6 * s, p);
            // DB text
            p.setColor(Color.parseColor("#34D399"));
            p.setTextAlign(Paint.Align.CENTER);
            p.setTypeface(Typeface.DEFAULT_BOLD);
            p.setTextSize(14 * s);
            canvas.drawText("DB", 50 * s, 64 * s, p);
        } else if ("DELIVERY".equals(state)) {
            // Pose 3: Robot flying with jet flames firing from DB backpack
            p.setStyle(Paint.Style.FILL);
            // Jet flames at bottom
            p.setColor(Color.parseColor("#F59E0B"));
            Path flameL = new Path();
            flameL.moveTo(32 * s, 70 * s);
            flameL.lineTo(39 * s, 94 * s);
            flameL.lineTo(46 * s, 70 * s);
            flameL.close();
            canvas.drawPath(flameL, p);

            Path flameR = new Path();
            flameR.moveTo(54 * s, 70 * s);
            flameR.lineTo(61 * s, 94 * s);
            flameR.lineTo(68 * s, 70 * s);
            flameR.close();
            canvas.drawPath(flameR, p);

            // Green DB Jetpack behind
            p.setColor(Color.parseColor("#10B981"));
            canvas.drawRoundRect(new RectF(22 * s, 44 * s, 78 * s, 72 * s), 8 * s, 8 * s, p);

            // Robot torso & head
            p.setColor(Color.parseColor("#F8FAFC"));
            canvas.drawRoundRect(new RectF(34 * s, 48 * s, 66 * s, 74 * s), 10 * s, 10 * s, p);
            canvas.drawRoundRect(new RectF(30 * s, 16 * s, 70 * s, 48 * s), 14 * s, 14 * s, p);

            // Visor & glowing eyes
            p.setColor(Color.parseColor("#090D16"));
            canvas.drawRoundRect(new RectF(35 * s, 23 * s, 65 * s, 41 * s), 8 * s, 8 * s, p);
            p.setColor(Color.parseColor("#34D399"));
            canvas.drawCircle(43 * s, 32 * s, 3.8f * s, p);
            canvas.drawCircle(57 * s, 32 * s, 3.8f * s, p);
        } else {
            // Pose 1: ACTIVE / ONLINE (Robot 3/4 front with green DB backpack & Thumbs-Up)
            p.setStyle(Paint.Style.FILL);
            // Green DB backpack peeking on left
            p.setColor(Color.parseColor("#10B981"));
            canvas.drawRoundRect(new RectF(16 * s, 42 * s, 38 * s, 76 * s), 7 * s, 7 * s, p);

            // Robot torso & head
            p.setColor(Color.parseColor("#F8FAFC"));
            canvas.drawRoundRect(new RectF(32 * s, 54 * s, 68 * s, 82 * s), 12 * s, 12 * s, p);
            canvas.drawRoundRect(new RectF(28 * s, 18 * s, 72 * s, 54 * s), 16 * s, 16 * s, p);

            // Dark visor
            p.setColor(Color.parseColor("#090D16"));
            canvas.drawRoundRect(new RectF(34 * s, 25 * s, 66 * s, 46 * s), 9 * s, 9 * s, p);

            // Glowing green eyes
            p.setColor(Color.parseColor("#10B981"));
            canvas.drawCircle(44 * s, 35 * s, 4.2f * s, p);
            canvas.drawCircle(57 * s, 35 * s, 4.2f * s, p);

            // Thumbs-up hand on right
            p.setColor(Color.parseColor("#34D399"));
            canvas.drawCircle(79 * s, 52 * s, 7 * s, p);
            canvas.drawRoundRect(new RectF(76 * s, 40 * s, 82 * s, 50 * s), 3 * s, 3 * s, p);
        }
    }

    private void removeFloatingBubble() {
        if (bubbleContainer != null && windowManager != null) {
            try {
                windowManager.removeView(bubbleContainer);
            } catch (Exception ignored) {
            }
        }
        bubbleContainer = null;
        mascotImageView = null;
        badgeCaptionView = null;
    }

    @SuppressWarnings("deprecation")
    private void startForegroundNotification() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "Delivery Buddy — Bolinha Flutuante & Mapa",
                NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Toque na bolinha DB para abrir ou segure 0.4s para comando de voz.");
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
            .setContentText("1 toque na bolinha DB abre • Segurar 0.4s ativa voz")
            .setSmallIcon(android.R.drawable.ic_dialog_map)
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
