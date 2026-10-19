package com.pbg.deliverybuddy;

import android.Manifest;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.Settings;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import android.webkit.WebView;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import com.getcapacitor.BridgeActivity;
import java.util.ArrayList;
import java.util.List;

public class MainActivity extends BridgeActivity {

    private boolean isMicListening = true;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        requestRuntimePermissionsIfNeeded();

        if (getBridge() != null && getBridge().getWebView() != null) {
            WebView webView = getBridge().getWebView();
            webView.getSettings().setJavaScriptEnabled(true);
            webView.getSettings().setMediaPlaybackRequiresUserGesture(false);
            webView.addJavascriptInterface(new BuddyNativeOverlayBridge(), "BuddyNativeOverlay");

            webView.setWebChromeClient(new WebChromeClient() {
                @Override
                public void onPermissionRequest(final PermissionRequest request) {
                    if (request != null) {
                        request.grant(request.getResources());
                    }
                }
            });
        }
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        if (intent != null && intent.getBooleanExtra("RESTORE_FROM_BUBBLE", false)) {
            hideOverlayBubbleService();
            if (getBridge() != null && getBridge().getWebView() != null) {
                final WebView webView = getBridge().getWebView();
                webView.post(new Runnable() {
                    @Override
                    public void run() {
                        webView.evaluateJavascript(
                            "window.__onNativeBubbleRestore && window.__onNativeBubbleRestore();",
                            null
                        );
                    }
                });
            }
        }
    }

    @Override
    public void onResume() {
        super.onResume();
        hideOverlayBubbleService();
    }

    private void requestRuntimePermissionsIfNeeded() {
        List<String> needed = new ArrayList<>();
        needed.add(Manifest.permission.RECORD_AUDIO);
        needed.add(Manifest.permission.ACCESS_FINE_LOCATION);
        needed.add(Manifest.permission.ACCESS_COARSE_LOCATION);
        if (Build.VERSION.SDK_INT >= 33) {
            needed.add("android.permission.POST_NOTIFICATIONS");
        }
        List<String> missing = new ArrayList<>();
        for (String perm : needed) {
            if (ContextCompat.checkSelfPermission(this, perm) != PackageManager.PERMISSION_GRANTED) {
                missing.add(perm);
            }
        }
        if (!missing.isEmpty()) {
            ActivityCompat.requestPermissions(this, missing.toArray(new String[0]), 9101);
        }
    }

    private boolean ensureOverlayPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !Settings.canDrawOverlays(this)) {
            Intent intent = new Intent(
                Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                Uri.parse("package:" + getPackageName())
            );
            startActivity(intent);
            return false;
        }
        return true;
    }

    private void showOverlayBubbleService() {
        Intent svcIntent = new Intent(this, BuddyOverlayService.class);
        svcIntent.setAction(BuddyOverlayService.ACTION_SHOW_BUBBLE);
        svcIntent.putExtra(BuddyOverlayService.EXTRA_IS_LISTENING, isMicListening);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(svcIntent);
        } else {
            startService(svcIntent);
        }
    }

    private void hideOverlayBubbleService() {
        Intent svcIntent = new Intent(this, BuddyOverlayService.class);
        svcIntent.setAction(BuddyOverlayService.ACTION_HIDE_BUBBLE);
        startService(svcIntent);
    }

    public class BuddyNativeOverlayBridge {

        @JavascriptInterface
        public void minimizeToFloatingBubble() {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    if (ensureOverlayPermission()) {
                        showOverlayBubbleService();
                        moveTaskToBack(true);
                    }
                }
            });
        }

        @JavascriptInterface
        public void maximizeFromBubble() {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    hideOverlayBubbleService();
                    Intent bringFrontIntent = new Intent(MainActivity.this, MainActivity.class);
                    bringFrontIntent.addFlags(
                        Intent.FLAG_ACTIVITY_NEW_TASK |
                        Intent.FLAG_ACTIVITY_REORDER_TO_FRONT |
                        Intent.FLAG_ACTIVITY_SINGLE_TOP
                    );
                    bringFrontIntent.putExtra("RESTORE_FROM_BUBBLE", true);
                    startActivity(bringFrontIntent);
                }
            });
        }

        @JavascriptInterface
        public void setBubbleListeningState(final boolean listening) {
            isMicListening = listening;
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    Intent svcIntent = new Intent(MainActivity.this, BuddyOverlayService.class);
                    svcIntent.setAction(BuddyOverlayService.ACTION_UPDATE_LISTENING);
                    svcIntent.putExtra(BuddyOverlayService.EXTRA_IS_LISTENING, listening);
                    startService(svcIntent);
                }
            });
        }
    }
}
