package com.pbg.deliverybuddy;

import android.Manifest;
import android.app.ActivityManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
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
import android.webkit.WebSettings;
import android.webkit.WebView;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import com.getcapacitor.BridgeActivity;
import java.lang.ref.WeakReference;
import java.net.HttpURLConnection;
import java.net.URL;
import java.text.Normalizer;
import java.util.ArrayList;
import java.util.List;
import org.json.JSONObject;

public class MainActivity extends BridgeActivity {

    private static final String LIVE_OTA_URL = "https://iokmoreira.github.io/Delivery-buddy/";
    private static WeakReference<MainActivity> instanceRef;

    public static MainActivity getInstance() {
        return instanceRef != null ? instanceRef.get() : null;
    }

    private final Handler mainHandler = new Handler(Looper.getMainLooper());
    private SpeechRecognizer speechRecognizer;
    private Intent recognizerIntent;

    // 100% Silent by Default: single-shot on-demand voice only (NEVER loops!)
    private boolean isSingleShotListening = false;
    private boolean isInForeground = true;
    private long lastDirectJavaCommandTs = 0L;

    // 6-second single-shot silence watchdog: automatically closes and releases hardware mic
    private final Runnable singleShotTimeoutRunnable = new Runnable() {
        @Override
        public void run() {
            stopAndReleaseMicrophoneNow();
        }
    };

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        instanceRef = new WeakReference<>(this);
        isSingleShotListening = false;

        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        requestRuntimePermissionsIfNeeded();
        initRecognizerIntent();

        if (getBridge() != null && getBridge().getWebView() != null) {
            final WebView webView = getBridge().getWebView();
            WebSettings settings = webView.getSettings();
            settings.setJavaScriptEnabled(true);
            settings.setDomStorageEnabled(true);
            settings.setCacheMode(WebSettings.LOAD_DEFAULT);
            settings.setMediaPlaybackRequiresUserGesture(false);
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

            // Automatic Live OTA check on startup: load https://iokmoreira.github.io/Delivery-buddy/ if reachable,
            // otherwise stay on the bundled local Capacitor build (https://localhost) seamlessly!
            checkAndLoadLiveOtaIfOnline(false);
        }
    }

    @SuppressWarnings("deprecation")
    private boolean isNetworkAvailable() {
        try {
            ConnectivityManager cm = (ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE);
            if (cm == null) return false;
            NetworkInfo active = cm.getActiveNetworkInfo();
            return active != null && active.isConnected();
        } catch (Exception e) {
            return false;
        }
    }

    private void checkAndLoadLiveOtaIfOnline(final boolean clearCacheFirst) {
        if (!isNetworkAvailable()) {
            return;
        }
        new Thread(new Runnable() {
            @Override
            public void run() {
                HttpURLConnection conn = null;
                try {
                    URL url = new URL(LIVE_OTA_URL + "?ota_ping=" + System.currentTimeMillis());
                    conn = (HttpURLConnection) url.openConnection();
                    conn.setRequestMethod("GET");
                    conn.setConnectTimeout(2500);
                    conn.setReadTimeout(2500);
                    conn.setInstanceFollowRedirects(true);
                    int code = conn.getResponseCode();
                    if (code >= 200 && code < 300) {
                        mainHandler.post(new Runnable() {
                            @Override
                            public void run() {
                                if (getBridge() != null && getBridge().getWebView() != null) {
                                    WebView wv = getBridge().getWebView();
                                    if (clearCacheFirst) {
                                        wv.clearCache(true);
                                    }
                                    wv.loadUrl(LIVE_OTA_URL + "?ota_ts=" + System.currentTimeMillis());
                                }
                            }
                        });
                    } else if (clearCacheFirst) {
                        mainHandler.post(new Runnable() {
                            @Override
                            public void run() {
                                if (getBridge() != null && getBridge().getWebView() != null) {
                                    getBridge().getWebView().reload();
                                }
                            }
                        });
                    }
                } catch (Exception ignored) {
                    if (clearCacheFirst) {
                        mainHandler.post(new Runnable() {
                            @Override
                            public void run() {
                                if (getBridge() != null && getBridge().getWebView() != null) {
                                    getBridge().getWebView().reload();
                                }
                            }
                        });
                    }
                } finally {
                    if (conn != null) {
                        conn.disconnect();
                    }
                }
            }
        }).start();
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
        recognizerIntent.putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_MINIMUM_LENGTH_MILLIS, 6000L);
        recognizerIntent.putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS, 2500L);
        recognizerIntent.putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_POSSIBLY_COMPLETE_SILENCE_LENGTH_MILLIS, 2000L);
    }

    public void startSingleShotVoiceFromOverlay() {
        mainHandler.post(new Runnable() {
            @Override
            public void run() {
                startSingleShotVoiceRecognition();
            }
        });
    }

    private void startSingleShotVoiceRecognition() {
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO)
            != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(
                this,
                new String[] { Manifest.permission.RECORD_AUDIO },
                9102
            );
            stopAndReleaseMicrophoneNow();
            return;
        }

        // Clean up any previous recognizer before starting a fresh single-shot session
        destroySpeechRecognizerInternal();

        try {
            speechRecognizer = SpeechRecognizer.createSpeechRecognizer(getApplicationContext());
            speechRecognizer.setRecognitionListener(new RecognitionListener() {
                @Override
                public void onReadyForSpeech(Bundle params) {
                    isSingleShotListening = true;
                    BuddyOverlayService.updateListeningState(MainActivity.this, true);
                    notifyWebViewListeningState(true);
                }

                @Override
                public void onBeginningOfSpeech() {
                    isSingleShotListening = true;
                }

                @Override
                public void onRmsChanged(float rmsdB) {
                }

                @Override
                public void onBufferReceived(byte[] buffer) {
                }

                @Override
                public void onEndOfSpeech() {
                    // Single-shot mode: never auto-restart in a loop!
                }

                @Override
                public void onError(int error) {
                    // Single-shot mode: immediately release hardware mic on error or silence timeout
                    stopAndReleaseMicrophoneNow();
                }

                @Override
                public void onResults(Bundle results) {
                    if (results != null) {
                        ArrayList<String> matches = results.getStringArrayList(
                            SpeechRecognizer.RESULTS_RECOGNITION
                        );
                        if (matches != null && !matches.isEmpty()) {
                            String bestText = matches.get(0);
                            handleRecognizedSpeech(bestText, true);
                        }
                    }
                    // Immediately close and release microphone after single command completes
                    stopAndReleaseMicrophoneNow();
                }

                @Override
                public void onPartialResults(Bundle partialResults) {
                    if (!isSingleShotListening || partialResults == null) return;
                    ArrayList<String> partials = partialResults.getStringArrayList(
                        SpeechRecognizer.RESULTS_RECOGNITION
                    );
                    if (partials != null && !partials.isEmpty()) {
                        String partialText = partials.get(0);
                        if (partialText != null && !partialText.trim().isEmpty()) {
                            handleRecognizedSpeech(partialText.trim(), false);
                        }
                    }
                }

                @Override
                public void onEvent(int eventType, Bundle params) {
                }
            });

            isSingleShotListening = true;
            BuddyOverlayService.updateListeningState(MainActivity.this, true);
            notifyWebViewListeningState(true);
            speechRecognizer.startListening(recognizerIntent);

            // 6-second maximum single-shot watchdog
            mainHandler.removeCallbacks(singleShotTimeoutRunnable);
            mainHandler.postDelayed(singleShotTimeoutRunnable, 6000L);
        } catch (Exception e) {
            stopAndReleaseMicrophoneNow();
        }
    }

    private void stopAndReleaseMicrophoneNow() {
        isSingleShotListening = false;
        mainHandler.removeCallbacks(singleShotTimeoutRunnable);
        destroySpeechRecognizerInternal();
        BuddyOverlayService.updateListeningState(MainActivity.this, false);
        notifyWebViewListeningState(false);
    }

    private void destroySpeechRecognizerInternal() {
        isSingleShotListening = false;
        mainHandler.removeCallbacks(singleShotTimeoutRunnable);
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

    private boolean isActionableFastCommand(String norm) {
        return norm.contains("minimizar")
            || norm.contains("minimizer")
            || norm.contains("minimiz")
            || norm.contains("modo invisivel")
            || norm.contains("maximizar")
            || norm.contains("maximizer")
            || norm.contains("maximiz")
            || norm.contains("abrir")
            || norm.contains("mostrar tela")
            || norm.contains("restaurar")
            || norm.contains("aceitar")
            || norm.contains("recusar")
            || norm.contains("rejeitar")
            || norm.contains("dividir pedido")
            || norm.contains("iniciar entrega")
            || norm.contains("finalizar entrega")
            || norm.contains("modo chuva")
            || norm.contains("mapa")
            || norm.contains("financas")
            || norm.contains("inicio");
    }

    private void handleRecognizedSpeech(final String text, final boolean isFinal) {
        if (text == null || text.trim().isEmpty()) return;

        String norm = normalizeText(text);
        long now = SystemClock.uptimeMillis();
        boolean matchedFastCmd = isActionableFastCommand(norm);

        // Execute native window minimize/maximize directly in Java without waiting for WebView round-trip
        if (now - lastDirectJavaCommandTs > 1800L) {
            if (norm.contains("minimizar")
                || norm.contains("minimizer")
                || norm.contains("minimiz")
                || norm.contains("modo invisivel")
                || norm.contains("esconder")
                || norm.contains("ocultar")) {
                lastDirectJavaCommandTs = now;
                stopAndReleaseMicrophoneNow();
                minimizeToFloatingBubbleNow();
            } else if (norm.contains("maximizar")
                || norm.contains("maximizer")
                || norm.contains("maximiz")
                || norm.contains("abrir")
                || norm.contains("mostrar tela")
                || norm.contains("restaurar")) {
                lastDirectJavaCommandTs = now;
                stopAndReleaseMicrophoneNow();
                bringActivityToFrontNow();
            } else if (matchedFastCmd) {
                // Immediately release microphone hardware as soon as a fast command is captured!
                stopAndReleaseMicrophoneNow();
            }
        }

        if (getBridge() != null && getBridge().getWebView() != null) {
            final WebView webView = getBridge().getWebView();
            final boolean treatAsFinal = isFinal || matchedFastCmd;
            webView.post(new Runnable() {
                @Override
                public void run() {
                    String quoted = JSONObject.quote(text.trim());
                    String js = "window.onBuddyNativeTranscript && window.onBuddyNativeTranscript("
                        + quoted + ", " + (treatAsFinal ? "true" : "false") + ");";
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
                    BuddyOverlayService.showBubble(MainActivity.this, isSingleShotListening);
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
        BuddyOverlayService.hideBubble(this);
    }

    @Override
    public void onPause() {
        super.onPause();
        isInForeground = false;
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M || Settings.canDrawOverlays(this)) {
            BuddyOverlayService.showBubble(this, isSingleShotListening);
        }
    }

    @Override
    public void onStop() {
        super.onStop();
        isInForeground = false;
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M || Settings.canDrawOverlays(this)) {
            BuddyOverlayService.showBubble(this, isSingleShotListening);
        }
    }

    @Override
    public void onDestroy() {
        stopAndReleaseMicrophoneNow();
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
                    startSingleShotVoiceRecognition();
                }
            });
        }

        @JavascriptInterface
        public void stopNativeVoice() {
            mainHandler.post(new Runnable() {
                @Override
                public void run() {
                    stopAndReleaseMicrophoneNow();
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
                        stopAndReleaseMicrophoneNow();
                    } else {
                        BuddyOverlayService.updateListeningState(MainActivity.this, true);
                    }
                }
            });
        }

        @JavascriptInterface
        public void reloadOtaNow() {
            checkAndLoadLiveOtaIfOnline(true);
        }
    }
}
