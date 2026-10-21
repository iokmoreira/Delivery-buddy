package com.pbg.deliverybuddy;

import android.accessibilityservice.AccessibilityService;
import android.accessibilityservice.AccessibilityServiceInfo;
import android.accessibilityservice.GestureDescription;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.content.Intent;
import android.graphics.Path;
import android.os.Build;
import android.os.Bundle;
import android.util.DisplayMetrics;
import android.util.Log;
import android.view.accessibility.AccessibilityEvent;
import android.view.accessibility.AccessibilityNodeInfo;

import java.lang.ref.WeakReference;
import java.util.List;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * BuddyAccessibilityService
 * Native Android AccessibilityService monitoring Glovo Rider (com.glovo.rider, com.glovoapp.rider),
 * Uber Driver / Uber Eats (com.ubercab.driver), and Bolt Courier (ee.mtakso.driver, com.bolt.delivery).
 * Automatically parses incoming order cards (€, km, min, pickup, dropoff), executes hands-free
 * "Aceitar" / "Recusar" clicks, and injects customer chat messages ("A caminho" / "Cheguei").
 */
public class BuddyAccessibilityService extends AccessibilityService {

    private static final String TAG = "BuddyAccessibility";
    private static volatile boolean instanceRunning = false;
    private static WeakReference<BuddyAccessibilityService> activeInstanceRef;

    // Regex patterns for Euro amounts (\d+[.,]\d{2}\s*€ or €\s*\d+[.,]\d{2})
    private static final Pattern EURO_PATTERN_1 = Pattern.compile("(?:€|EUR)\\s*(\\d{1,3}[.,]\\d{1,2})", Pattern.CASE_INSENSITIVE);
    private static final Pattern EURO_PATTERN_2 = Pattern.compile("(\\d{1,3}[.,]\\d{1,2})\\s*(?:€|EUR)", Pattern.CASE_INSENSITIVE);

    // Regex pattern for distance in KM (\d+([.,]\d+)?\s*km)
    private static final Pattern KM_PATTERN = Pattern.compile("(\\d{1,3}(?:[.,]\\d{1,2})?)\\s*km\\b", Pattern.CASE_INSENSITIVE);

    private long lastDetectedTimestampMs = 0L;
    private String lastDetectedSignature = "";

    public static boolean isServiceRunning() {
        return instanceRunning;
    }

    public static BuddyAccessibilityService getActiveInstance() {
        return activeInstanceRef != null ? activeInstanceRef.get() : null;
    }

    @Override
    protected void onServiceConnected() {
        super.onServiceConnected();
        instanceRunning = true;
        activeInstanceRef = new WeakReference<>(this);
        try {
            AccessibilityServiceInfo info = new AccessibilityServiceInfo();
            info.eventTypes = AccessibilityEvent.TYPE_WINDOW_CONTENT_CHANGED
                    | AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED
                    | AccessibilityEvent.TYPE_NOTIFICATION_STATE_CHANGED;
            info.feedbackType = AccessibilityServiceInfo.FEEDBACK_GENERIC;
            info.notificationTimeout = 120;
            info.flags = AccessibilityServiceInfo.FLAG_REPORT_VIEW_IDS
                    | AccessibilityServiceInfo.FLAG_RETRIEVE_INTERACTIVE_WINDOWS
                    | AccessibilityServiceInfo.FLAG_INCLUDE_NOT_IMPORTANT_VIEWS;
            setServiceInfo(info);
        } catch (Exception e) {
            Log.e(TAG, "Error configuring BuddyAccessibilityService: " + e.getMessage());
        }
    }

    @Override
    public void onAccessibilityEvent(AccessibilityEvent event) {
        if (event == null) return;

        CharSequence pkgCs = event.getPackageName();
        String pkg = pkgCs != null ? pkgCs.toString().toLowerCase(Locale.ROOT) : "";

        // Ignore our own package to prevent self-triggering loops on our own UI cards
        if (pkg.contains("deliverybuddy")) {
            return;
        }

        String platform = resolvePlatformFromPackage(pkg);
        StringBuilder collectedText = new StringBuilder();

        // 1. Collect text from event (including notification text)
        List<CharSequence> eventTexts = event.getText();
        if (eventTexts != null) {
            for (CharSequence cs : eventTexts) {
                if (cs != null) {
                    collectedText.append(cs).append(" ");
                }
            }
        }

        // 2. If it's a courier app window or notification, also traverse active window nodes
        boolean isCourierApp = platform != null
                || pkg.contains("com.glovo.rider")
                || pkg.contains("com.glovoapp.rider")
                || pkg.contains("com.ubercab.driver")
                || pkg.contains("ee.mtakso.driver")
                || pkg.contains("com.bolt.delivery")
                || pkg.contains("uber")
                || pkg.contains("glovo")
                || pkg.contains("bolt")
                || pkg.contains("mtakso");

        if (isCourierApp) {
            try {
                AccessibilityNodeInfo root = getRootInActiveWindow();
                if (root != null) {
                    appendNodeTextRecursive(root, collectedText, 0);
                    root.recycle();
                }
            } catch (Exception ignored) {
            }
        }

        String fullText = collectedText.toString().trim();
        if (fullText.length() < 5) return;

        Double euros = extractEuros(fullText);
        Double km = extractKm(fullText);

        if (euros != null && km != null && euros >= 1.50 && euros <= 85.0 && km >= 0.2 && km <= 60.0) {
            String resolvedPlatform = platform != null ? platform : guessPlatformFromText(fullText);
            String sig = String.format(Locale.US, "%s:%.2f:%.1f", resolvedPlatform, euros, km);
            long now = System.currentTimeMillis();
            if (sig.equals(lastDetectedSignature) && (now - lastDetectedTimestampMs) < 12000L) {
                return;
            }
            lastDetectedSignature = sig;
            lastDetectedTimestampMs = now;

            Log.i(TAG, "Auto-detected offer via BuddyAccessibilityService: " + sig);
            MainActivity.dispatchAutoDetectedOffer(getApplicationContext(), euros, km, resolvedPlatform);
        }
    }

    /**
     * Performs a native Accessibility click on "Aceitar" / "Aceitar pedido" / "Confirmar"
     * or "Recusar" / "Rejeitar" / "Ignorar", falling back to a screen gesture tap at (xPct, yPct).
     */
    public static boolean performOrderActionStatic(final String action, final int fallbackXPct, final int fallbackYPct) {
        final BuddyAccessibilityService svc = getActiveInstance();
        if (svc == null) return false;
        return svc.performOrderActionInternal(action, fallbackXPct, fallbackYPct);
    }

    public boolean performOrderActionInternal(final String action, final int fallbackXPct, final int fallbackYPct) {
        boolean isAccept = "ACCEPT".equalsIgnoreCase(action) || "ACEITAR".equalsIgnoreCase(action);
        String[] targetKeywords = isAccept
                ? new String[] { "aceitar pedido", "aceitar oferta", "aceitar", "confirmar", "corresponder" }
                : new String[] { "recusar", "rejeitar", "ignorar" };

        try {
            AccessibilityNodeInfo root = getRootInActiveWindow();
            if (root != null) {
                boolean clickedNode = findAndClickButtonNodeRecursive(root, targetKeywords, 0);
                root.recycle();
                if (clickedNode) {
                    return true;
                }
            }
        } catch (Exception ignored) {
        }

        // Fallback: dispatch tap gesture at calibrated screen percentage (Android 7.0+ API 24+)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            try {
                DisplayMetrics dm = getResources().getDisplayMetrics();
                int width = dm != null && dm.widthPixels > 0 ? dm.widthPixels : 1080;
                int height = dm != null && dm.heightPixels > 0 ? dm.heightPixels : 2400;
                float x = Math.max(20f, Math.min(width - 20f, (width * fallbackXPct) / 100f));
                float y = Math.max(20f, Math.min(height - 20f, (height * fallbackYPct) / 100f));

                Path clickPath = new Path();
                clickPath.moveTo(x, y);
                GestureDescription.StrokeDescription stroke = new GestureDescription.StrokeDescription(clickPath, 0, 85);
                GestureDescription.Builder builder = new GestureDescription.Builder();
                builder.addStroke(stroke);
                return dispatchGesture(builder.build(), null, null);
            } catch (Exception ignored) {
            }
        }
        return false;
    }

    private boolean findAndClickButtonNodeRecursive(AccessibilityNodeInfo node, String[] keywords, int depth) {
        if (node == null || depth > 14) return false;
        CharSequence t = node.getText();
        CharSequence cd = node.getContentDescription();
        String combined = ((t != null ? t.toString() : "") + " " + (cd != null ? cd.toString() : ""))
                .toLowerCase(Locale.ROOT)
                .trim();

        if (!combined.isEmpty()) {
            for (String kw : keywords) {
                if (combined.contains(kw)) {
                    AccessibilityNodeInfo clickable = node;
                    int upHops = 0;
                    while (clickable != null && !clickable.isClickable() && upHops < 4) {
                        clickable = clickable.getParent();
                        upHops++;
                    }
                    if (clickable != null && clickable.isClickable()) {
                        boolean ok = clickable.performAction(AccessibilityNodeInfo.ACTION_CLICK);
                        if (ok) return true;
                    }
                }
            }
        }

        int count = node.getChildCount();
        for (int i = 0; i < count; i++) {
            AccessibilityNodeInfo child = node.getChild(i);
            if (child != null) {
                boolean found = findAndClickButtonNodeRecursive(child, keywords, depth + 1);
                child.recycle();
                if (found) return true;
            }
        }
        return false;
    }

    /**
     * Copies message to Android Clipboard AND injects it into any open Customer Chat input field.
     */
    public static boolean injectCustomerChatMessageStatic(final Context ctx, final String message) {
        if (message == null || message.trim().isEmpty()) return false;
        try {
            if (ctx != null) {
                ClipboardManager cm = (ClipboardManager) ctx.getSystemService(Context.CLIPBOARD_SERVICE);
                if (cm != null) {
                    cm.setPrimaryClip(ClipData.newPlainText("BuddyChatMacro", message.trim()));
                }
            }
        } catch (Exception ignored) {
        }

        final BuddyAccessibilityService svc = getActiveInstance();
        if (svc == null) return false;
        return svc.injectChatTextIntoActiveWindow(message.trim());
    }

    private boolean injectChatTextIntoActiveWindow(final String message) {
        try {
            AccessibilityNodeInfo root = getRootInActiveWindow();
            if (root == null) return false;
            boolean injected = findAndSetEditTextRecursive(root, message, 0);
            root.recycle();
            return injected;
        } catch (Exception ignored) {
            return false;
        }
    }

    private boolean findAndSetEditTextRecursive(AccessibilityNodeInfo node, String message, int depth) {
        if (node == null || depth > 14) return false;
        CharSequence cls = node.getClassName();
        String clsName = cls != null ? cls.toString() : "";
        if (node.isEditable() || clsName.contains("EditText")) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                Bundle args = new Bundle();
                args.putCharSequence(AccessibilityNodeInfo.ACTION_ARGUMENT_SET_TEXT_CHARSEQUENCE, message);
                node.performAction(AccessibilityNodeInfo.ACTION_FOCUS);
                if (node.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, args)) {
                    return true;
                }
            }
            node.performAction(AccessibilityNodeInfo.ACTION_FOCUS);
            if (node.performAction(AccessibilityNodeInfo.ACTION_PASTE)) {
                return true;
            }
        }
        int count = node.getChildCount();
        for (int i = 0; i < count; i++) {
            AccessibilityNodeInfo child = node.getChild(i);
            if (child != null) {
                boolean ok = findAndSetEditTextRecursive(child, message, depth + 1);
                child.recycle();
                if (ok) return true;
            }
        }
        return false;
    }

    private void appendNodeTextRecursive(AccessibilityNodeInfo node, StringBuilder sb, int depth) {
        if (node == null || depth > 14 || sb.length() > 2600) return;
        CharSequence t = node.getText();
        if (t != null && t.length() > 0) {
            sb.append(t).append(" ");
        }
        CharSequence cd = node.getContentDescription();
        if (cd != null && cd.length() > 0) {
            sb.append(cd).append(" ");
        }
        int count = node.getChildCount();
        for (int i = 0; i < count; i++) {
            AccessibilityNodeInfo child = node.getChild(i);
            if (child != null) {
                appendNodeTextRecursive(child, sb, depth + 1);
                child.recycle();
            }
        }
    }

    private String resolvePlatformFromPackage(String pkg) {
        if (pkg.contains("ubercab") || pkg.contains("uber")) return "Uber Eats";
        if (pkg.contains("glovo.rider") || pkg.contains("glovoapp.rider") || pkg.contains("glovo")) return "Glovo";
        if (pkg.contains("mtakso") || pkg.contains("bolt.delivery") || pkg.contains("bolt")) return "Bolt Food";
        return null;
    }

    private String guessPlatformFromText(String text) {
        String lower = text.toLowerCase(Locale.ROOT);
        if (lower.contains("glovo")) return "Glovo";
        if (lower.contains("bolt")) return "Bolt Food";
        return "Uber Eats";
    }

    private Double extractEuros(String text) {
        Matcher m1 = EURO_PATTERN_1.matcher(text);
        if (m1.find()) {
            return parseDoubleSafe(m1.group(1));
        }
        Matcher m2 = EURO_PATTERN_2.matcher(text);
        if (m2.find()) {
            return parseDoubleSafe(m2.group(1));
        }
        return null;
    }

    private Double extractKm(String text) {
        Matcher m = KM_PATTERN.matcher(text);
        if (m.find()) {
            return parseDoubleSafe(m.group(1));
        }
        return null;
    }

    private Double parseDoubleSafe(String raw) {
        if (raw == null) return null;
        try {
            return Double.parseDouble(raw.replace(',', '.').trim());
        } catch (Exception e) {
            return null;
        }
    }

    @Override
    public void onInterrupt() {
        instanceRunning = false;
    }

    @Override
    public boolean onUnbind(Intent intent) {
        instanceRunning = false;
        return super.onUnbind(intent);
    }
}
