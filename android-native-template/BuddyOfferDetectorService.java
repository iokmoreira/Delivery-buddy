package com.pbg.deliverybuddy;

import android.accessibilityservice.AccessibilityService;
import android.accessibilityservice.AccessibilityServiceInfo;
import android.content.Intent;
import android.util.Log;
import android.view.accessibility.AccessibilityEvent;
import android.view.accessibility.AccessibilityNodeInfo;

import java.util.List;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * BuddyOfferDetectorService
 * Native Android AccessibilityService that automatically detects incoming delivery offers
 * on Uber Driver (com.ubercab.driver), Glovo Courier (com.glovo.courier), and Bolt Food
 * without requiring any manual input from the courier.
 */
public class BuddyOfferDetectorService extends AccessibilityService {

    private static final String TAG = "BuddyOfferDetector";
    private static volatile boolean instanceRunning = false;

    // Regex patterns for Euro amounts (e.g. "5,50 €", "€ 6.20", "€5,80")
    private static final Pattern EURO_PATTERN_1 = Pattern.compile("(?:€|EUR)\\s*(\\d{1,3}[.,]\\d{1,2})", Pattern.CASE_INSENSITIVE);
    private static final Pattern EURO_PATTERN_2 = Pattern.compile("(\\d{1,3}[.,]\\d{1,2})\\s*(?:€|EUR)", Pattern.CASE_INSENSITIVE);

    // Regex pattern for distance in KM (e.g. "3,1 km", "4.5 km", "2,8km")
    private static final Pattern KM_PATTERN = Pattern.compile("(\\d{1,3}(?:[.,]\\d{1,2})?)\\s*km\\b", Pattern.CASE_INSENSITIVE);

    private long lastDetectedTimestampMs = 0L;
    private String lastDetectedSignature = "";

    public static boolean isServiceRunning() {
        return instanceRunning;
    }

    @Override
    protected void onServiceConnected() {
        super.onServiceConnected();
        instanceRunning = true;
        try {
            AccessibilityServiceInfo info = new AccessibilityServiceInfo();
            info.eventTypes = AccessibilityEvent.TYPE_WINDOW_CONTENT_CHANGED
                    | AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED
                    | AccessibilityEvent.TYPE_NOTIFICATION_STATE_CHANGED;
            info.feedbackType = AccessibilityServiceInfo.FEEDBACK_GENERIC;
            info.notificationTimeout = 150;
            info.flags = AccessibilityServiceInfo.FLAG_REPORT_VIEW_IDS
                    | AccessibilityServiceInfo.FLAG_RETRIEVE_INTERACTIVE_WINDOWS;
            setServiceInfo(info);
        } catch (Exception e) {
            Log.e(TAG, "Error configuring BuddyOfferDetectorService: " + e.getMessage());
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

            Log.i(TAG, "Auto-detected offer: " + sig);
            MainActivity.dispatchAutoDetectedOffer(getApplicationContext(), euros, km, resolvedPlatform);
        }
    }

    private void appendNodeTextRecursive(AccessibilityNodeInfo node, StringBuilder sb, int depth) {
        if (node == null || depth > 14 || sb.length() > 2400) return;
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
        if (pkg.contains("uber")) return "Uber Eats";
        if (pkg.contains("glovo")) return "Glovo";
        if (pkg.contains("bolt") || pkg.contains("mtakso")) return "Bolt Food";
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
