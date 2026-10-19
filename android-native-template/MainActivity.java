package com.pbg.deliverybuddy;

import android.Manifest;
import android.app.ActivityManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.os.SystemClock;
import android.provider.Settings;
import android.speech.RecognitionListener;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import android.webkit.WebView;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import com.getcapacitor.BridgeActivity;
import java.lang.ref.WeakReference;
import java.text.Normalizer;
import java.util.ArrayList;
import java.util.List;
import org.json.JSONObject;

public class MainActivity extends BridgeActivity {

    private static WeakReference<MainActivity> instanceRef;

    public static MainActivity getInstance() {
        return instanceRef != null ? instanceRef.get() : null;
    }

    private final Handler mainHandler = new Handler(Looper.getMainLooper());
    private SpeechRecognizer speechRecognizer;
    private Intent recognizerIntent;

    // Strictly OFF (false) by default on startup — never auto-starts without user tap!
    private volatile boolean keepListening = false;
    private boolean isRecognizerListening = false;
    private boolean isInForeground = true;
    private long lastDirectJavaCommandTs = 0L;
    private String lastForwardedPartial = "";

    private final Runnable restartRecognizerRunnable = new Runnable() {
        @Override
        public void run() {
            if (keepListening) {
                startNativeSpeechRecognizerInternal();
            } else {
                destroySpeechRecognizerInternal();
                BuddyOverlayService.updateListeningState(MainActivity.this, false);
            }
        }
    };

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        instanceRef = new WeakReference<>(this);

        // Strictly ensure mic is OFF on launch
        keepListening = false;
        isRecognizerListening = false;

        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        requestRuntimePermissionsIfNeeded();
        initRecognizerIntent();

        if (getBridge() != null && getBridge().getWebView() != null) {
            WebView webView = getBridge().getWebView();
            webView.getSettings().setJavaScriptEnabled(true);
            webView.getSettings().setMediaPlaybackRequiresUserGesture(false);
            webView.addJavascriptInterface(new BuddyNativeOverlayBridge(), "BuddyNativeOverlay");

            webView.setWebChromeClient(new WebChromeClient() {
                @Override
                public void onPermissionRequest(final PermissionRequest request) {
                    if (request != null) {
                        mainHandler.post(new Runnable() {
                            @Override
                            public void run() {
                                try {
                                    request.grant(request.getResources());
                                } catch (Exception ignored) {
                                }
                            }
                        });
                    }
                }
            });
        }
    }

    private void initRecognizerIntent() {
        recognizerIntent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
        recognizerIntent.putExtra(
            RecognizerIntent.EXTRA_LANGUAGE_MODEL,
            RecognizerIntent.LANGUAGE_MODEL_FREE_FORM
        );
        recognizerIntent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, "pt-PT");
        recognizerIntent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_PREFERENCE, "pt-PT");
        recognizerIntent.putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true);
        recognizerIntent.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 3);
        // Extended silence windows so Android One UI does not cut off and blink every 2 seconds
        recognizerIntent.putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_MINIMUM_LENGTH_MILLIS, 10000L);
        recognizerIntent.putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS, 5000L);
        recognizerIntent.putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_POSSIBLY_COMPLETE_SILENCE_LENGTH_MILLIS, 4000L);
    }

    private void startNativeSpeechRecognizerInternal() {
        if (!keepListening) {
            destroySpeechRecognizerInternal();
            BuddyOverlayService.updateListeningState(MainActivity.this, false);
            return;
        }

        if (ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO)
            != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(
                this,
                new String[] { Manifest.permission.RECORD_AUDIO },
                9102
            );
            return;
        }

        try {
            if (speechRecognizer == null) {
                speechRecognizer = SpeechRecognizer.createSpeechRecognizer(getApplicationContext());
                speechRecognizer.setRecognitionListener(new RecognitionListener() {
                    @Override
                    public void onReadyForSpeech(Bundle params) {
                        if (!keepListening) {
                            destroySpeechRecognizerInternal();
                            return;
                        }
                        isRecognizerListening = true;
                        BuddyOverlayService.updateListeningState(MainActivity.this, true);
                    }

                    @Override
                    public void onBeginningOfSpeech() {
                        if (!keepListening) {
                            destroySpeechRecognizerInternal();
                            return;
                        }
                        isRecognizerListening = true;
                    }

                    @Override
                    public void onRmsChanged(float rmsdB) {
                    }

                    @Override
                    public void onBufferReceived(byte[] buffer) {
                    }

                    @Override
                    public void onEndOfSpeech() {
                        isRecognizerListening = false;
                        if (keepListening) {
                            mainHandler.removeCallbacks(restartRecognizerRunnable);
                            mainHandler.postDelayed(restartRecognizerRunnable, 900);
                        } else {
                            destroySpeechRecognizerInternal();
                            BuddyOverlayService.updateListeningState(MainActivity.this, false);
                        }
                    }

                    @Override
                    public void onError(int error) {
                        isRecognizerListening = false;
                        if (!keepListening) {
                            destroySpeechRecognizerInternal();
                            BuddyOverlayService.updateListeningState(MainActivity.this, false);
                            return;
                        }

                        if (error == SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS) {
                            keepListening = false;
                            destroySpeechRecognizerInternal();
                            BuddyOverlayService.updateListeningState(MainActivity.this, false);
                            notifyWebViewListeningState(false);
                            return;
                        }

                        if (error == SpeechRecognizer.ERROR_RECOGNIZER_BUSY
                            || error == SpeechRecognizer.ERROR_CLIENT) {
                            destroySpeechRecognizerInternal();
                            if (keepListening) {
                                mainHandler.removeCallbacks(restartRecognizerRunnable);
                                mainHandler.postDelayed(restartRecognizerRunnable, 1500);
                            }
                            return;
                        }

                        if (keepListening) {
                            mainHandler.removeCallbacks(restartRecognizerRunnable);
                            mainHandler.postDelayed(restartRecognizerRunnable, 1200);
                        } else {
                            BuddyOverlayService.updateListeningState(MainActivity.this, false);
                        }
                    }

                    @Override
                    public void onResults(Bundle results) {
                        isRecognizerListening = false;
                        lastForwardedPartial = "";
                        if (keepListening && results != null) {
                            ArrayList<String> matches = results.getStringArrayList(
                                SpeechRecognizer.RESULTS_RECOGNITION
                            );
                            if (matches != null && !matches.isEmpty()) {
                                String bestText = matches.get(0);
                                handleRecognizedSpeech(bestText, true);
                            }
                        }
                        if (keepListening) {
                            mainHandler.removeCallbacks(restartRecognizerRunnable);
                            mainHandler.postDelayed(restartRecognizerRunnable, 800);
                        } else {
                            destroySpeechRecognizerInternal();
                            BuddyOverlayService.updateListeningState(MainActivity.this, false);
                        }
                    }

                    @Override
                    public void onPartialResults(Bundle partialResults) {
                        if (!keepListening || partialResults == null) return;
                        ArrayList<String> partials = partialResults.getStringArrayList(
                            SpeechRecognizer.RESULTS_RECOGNITION
                        );
                        if (partials != null && !partials.isEmpty()) {
                            String partialText = partials.get(0);
                            if (partialText != null && !partialText.trim().isEmpty()) {
                                String trimmed = partialText.trim();
                                if (!trimmed.equalsIgnoreCase(lastForwardedPartial)) {
                                    lastForwardedPartial = trimmed;
                                    handleRecognizedSpeech(trimmed, false);
                                }
                            }
                        }
                    }

                    @Override
                    public void onEvent(int eventType, Bundle params) {
                    }
                });
            }

            if (!isRecognizerListening && keepListening) {
                isRecognizerListening = true;
                lastForwardedPartial = "";
                speechRecognizer.startListening(recognizerIntent);
                BuddyOverlayService.updateListeningState(MainActivity.this, true);
            }
        } catch (Exception e) {
            isRecognizerListening = false;
            if (keepListening) {
                mainHandler.removeCallbacks(restartRecognizerRunnable);
                mainHandler.postDelayed(restartRecognizerRunnable, 1500);
            }
        }
    }

    private void destroySpeechRecognizerInternal() {
        isRecognizerListening = false;
        mainHandler.removeCallbacks(restartRecognizerRunnable);
        if (speechRecognizer != null) {
            try {
                speechRecognizer.stopListening();
            } catch (Exception ignored) {
            }
            try {
                speechRecognizer.cancel();
            } catch (Exception ignored) {
            }
            try {
                speechRecognizer.destroy();
            } catch (Exception ignored) {
            }
            speechRecognizer = null;
        }
    }

    private String normalizeText(String raw) {
        if (raw == null) return "";
        String nfd = Normalizer.normalize(raw.toLowerCase().trim(), Normalizer.Form.NFD);
        return nfd.replaceAll("[\\p{InCombiningDiacriticalMarks}]", "");
    }

    private void handleRecognizedSpeech(final String text, final boolean isFinal) {
        if (!keepListening || text == null || text.trim().isEmpty()) return;

        String norm = normalizeText(text);
        long now = SystemClock.uptimeMillis();

        // Direct Java-level execution for "minimizar" and "maximizar" / "abrir" in onPartialResults & onResults
        if (now - lastDirectJavaCommandTs > 2200L) {
            if (norm.contains("minimizar")
                || norm.contains("minimizer")
                || norm.contains("minimiz")
                || norm.contains("modo invisivel")
                || norm.contains("esconder")
                || norm.contains("ocultar")) {
                lastDirectJavaCommandTs = now;
                minimizeToFloatingBubbleNow();
            } else if (norm.contains("maximizar")
                || norm.contains("maximizer")
                || norm.contains("maximiz")
                || norm.contains("abrir")
                || norm.contains("mostrar tela")
                || norm.contains("restaurar")) {
                lastDirectJavaCommandTs = now;
                bringActivityToFrontNow();
            }
        }

        // Forward both partial and final transcripts to WebView so React executes all commands ("aceitar", "recusar", "iniciar entrega", "finalizar entrega", "modo chuva", "mapa", "finanças", "início", etc.)
        if (getBridge() != null && getBridge().getWebView() != null) {
            final WebView webView = getBridge().getWebView();
            webView.post(new Runnable() {
                @Override
                public void run() {
                    String quoted = JSONObject.quote(text.trim());
                    String js = "window.onBuddyNativeTranscript && window.onBuddyNativeTranscript("
                        + quoted + ", " + (isFinal ? "true" : "false") + ");";
                    webView.evaluateJavascript(js, null);
                }
            });
        }
    }

    private void notifyWebViewListeningState(final boolean listening) {
        if (getBridge() != null && getBridge().getWebView() != null) {
            final WebView webView = getBridge().getWebView();
            webView.post(new Runnable() {
                @Override
                public void run() {
                    webView.evaluateJavascript(
                        "window.onBuddyNativeListeningState && window.onBuddyNativeListeningState("
                            + (listening ? "true" : "false") + ");",
                        null
                    );
                }
            });
        }
    }

    public void notifyRestoredFromBubble() {
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

    private void minimizeToFloatingBubbleNow() {
        mainHandler.post(new Runnable() {
            @Override
            public void run() {
                if (ensureOverlayPermission()) {
                    BuddyOverlayService.showBubble(MainActivity.this, keepListening);
                    moveTaskToBack(true);
                }
            }
        });
    }

    private void bringActivityToFrontNow() {
        mainHandler.post(new Runnable() {
            @Override
            public void run() {
                BuddyOverlayService.hideBubble(MainActivity.this);
                try {
                    ActivityManager am = (ActivityManager) getSystemService(Context.ACTIVITY_SERVICE);
                    if (am != null) {
                        am.moveTaskToFront(getTaskId(), ActivityManager.MOVE_TASK_WITH_HOME);
                    }
                } catch (Exception ignored) {
                }

                Intent bringFrontIntent = new Intent(MainActivity.this, MainActivity.class);
                bringFrontIntent.setAction(Intent.ACTION_MAIN);
                bringFrontIntent.addCategory(Intent.CATEGORY_LAUNCHER);
                bringFrontIntent.addFlags(
                    Intent.FLAG_ACTIVITY_NEW_TASK
                        | Intent.FLAG_ACTIVITY_SINGLE_TOP
                        | Intent.FLAG_ACTIVITY_REORDER_TO_FRONT
                        | Intent.FLAG_ACTIVITY_CLEAR_TOP
                );
                bringFrontIntent.putExtra("RESTORE_FROM_BUBBLE", true);

                try {
                    int pendingFlags = Build.VERSION.SDK_INT >= Build.VERSION_CODES.M
                        ? (PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE)
                        : PendingIntent.FLAG_UPDATE_CURRENT;
                    PendingIntent pi = PendingIntent.getActivity(
                        MainActivity.this,
                        7703,
                        bringFrontIntent,
                        pendingFlags
                    );
                    pi.send();
                } catch (Exception ignored) {
                }

                try {
                    startActivity(bringFrontIntent);
                } catch (Exception ignored) {
                }
            }
        });
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        if (intent != null && intent.getBooleanExtra("RESTORE_FROM_BUBBLE", false)) {
            BuddyOverlayService.hideBubble(this);
            notifyRestoredFromBubble();
        }
    }

    @Override
    public void onResume() {
        super.onResume();
        isInForeground = true;
        // Hide the floating bubble overlay while MainActivity is in the foreground
        BuddyOverlayService.hideBubble(this);
    }

    @Override
    public void onPause() {
        super.onPause();
        isInForeground = false;
        // Show the floating DB bubble whenever MainActivity goes to the background
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M || Settings.canDrawOverlays(this)) {
            BuddyOverlayService.showBubble(this, keepListening);
        }
    }

    @Override
    public void onStop() {
        super.onStop();
        isInForeground = false;
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M || Settings.canDrawOverlays(this)) {
            BuddyOverlayService.showBubble(this, keepListening);
        }
    }

    @Override
    public void onDestroy() {
        keepListening = false;
        destroySpeechRecognizerInternal();
        super.onDestroy();
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

    public class BuddyNativeOverlayBridge {

        @JavascriptInterface
        public void startNativeVoice() {
            mainHandler.post(new Runnable() {
                @Override
                public void run() {
                    keepListening = true;
                    BuddyOverlayService.updateListeningState(MainActivity.this, true);
                    startNativeSpeechRecognizerInternal();
                }
            });
        }

        @JavascriptInterface
        public void stopNativeVoice() {
            mainHandler.post(new Runnable() {
                @Override
                public void run() {
                    keepListening = false;
                    destroySpeechRecognizerInternal();
                    BuddyOverlayService.updateListeningState(MainActivity.this, false);
                }
            });
        }

        @JavascriptInterface
        public void minimizeToFloatingBubble() {
            minimizeToFloatingBubbleNow();
        }

        @JavascriptInterface
        public void maximizeFromBubble() {
            bringActivityToFrontNow();
        }

        @JavascriptInterface
        public void setBubbleListeningState(final boolean listening) {
            mainHandler.post(new Runnable() {
                @Override
                public void run() {
                    if (!listening) {
                        keepListening = false;
                        destroySpeechRecognizerInternal();
                    }
                    BuddyOverlayService.updateListeningState(MainActivity.this, listening);
                }
            });
        }
    }
}
