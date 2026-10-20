package com.pbg.deliverybuddy;

import android.Manifest;
import android.app.ActivityManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.database.ContentObserver;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.media.AudioAttributes;
import android.media.AudioManager;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.os.SystemClock;
import android.provider.MediaStore;
import android.provider.Settings;
import android.speech.RecognitionListener;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import android.speech.tts.Voice;
import android.view.WindowManager;
import android.webkit.GeolocationPermissions;
import android.webkit.JavascriptInterface;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.widget.Toast;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import com.getcapacitor.BridgeActivity;
import java.lang.ref.WeakReference;
import java.net.HttpURLConnection;
import java.net.URL;
import java.text.Normalizer;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import org.json.JSONObject;

public class MainActivity extends BridgeActivity {

    private static final String LIVE_OTA_URL = "https://iokmoreira.github.io/Delivery-buddy/";
    private static WeakReference<MainActivity> instanceRef;

    public static MainActivity getInstance() {
        return instanceRef != null ? instanceRef.get() : null;
    }

    public boolean isActivityInForeground() {
        return isInForeground;
    }

    private final Handler mainHandler = new Handler(Looper.getMainLooper());
    private SpeechRecognizer speechRecognizer;
    private Intent recognizerIntent;
    private TextToSpeech nativeTts;
    private boolean nativeTtsReady = false;
    private ContentObserver screenshotObserver;
    private LocationManager locationManager;
    private LocationListener nativeLocationListener;
    private double lastNativeLat = 0.0;
    private double lastNativeLng = 0.0;
    private float lastNativeAccuracy = 999.0f;
    private boolean hasNativeGpsFix = false;
    private boolean hasHighAccuracyNativeGpsFix = false;
    private long lastHighAccuracyFixTimeMs = 0L;

    // 100% Silent by Default: single-shot on-demand voice only (NEVER loops!)
    private boolean isSingleShotListening = false;
    private boolean isInForeground = true;
    private boolean wasMinimizedToBubble = false;
    private boolean isOpeningSystemPicker = false;
    private static final int FILE_CHOOSER_REQUEST_CODE = 9201;
    private android.webkit.ValueCallback<Uri[]> fileUploadCallback;
    private long lastDirectJavaCommandTs = 0L;
    private String lastPartialTranscript = "";
    private String pendingWakeTranscript = null;

    // 7.5-second single-shot watchdog: stops listening so final results flush, then releases mic
    private final Runnable singleShotTimeoutRunnable = new Runnable() {
        @Override
        public void run() {
            if (speechRecognizer != null && isSingleShotListening) {
                try {
                    speechRecognizer.stopListening();
                } catch (Exception ignored) {
                }
            }
            mainHandler.postDelayed(new Runnable() {
                @Override
                public void run() {
                    if (isSingleShotListening) {
                        if (lastPartialTranscript != null && !lastPartialTranscript.trim().isEmpty()) {
                            String fallbackFinal = lastPartialTranscript.trim();
                            lastPartialTranscript = "";
                            handleRecognizedSpeech(fallbackFinal, true);
                        }
                        stopAndReleaseMicrophoneNow();
                    }
                }
            }, 650L);
        }
    };

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        instanceRef = new WeakReference<>(this);
        isSingleShotListening = false;

        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        setVolumeControlStream(AudioManager.STREAM_MUSIC);
        requestRuntimePermissionsIfNeeded();
        initRecognizerIntent();
        initNativeTts();
        registerScreenshotObserver();
        startNativeGpsTrackingIfPermitted();

        if (getBridge() != null && getBridge().getWebView() != null) {
            final WebView webView = getBridge().getWebView();
            WebSettings settings = webView.getSettings();
            settings.setJavaScriptEnabled(true);
            settings.setDomStorageEnabled(true);
            settings.setGeolocationEnabled(true);
            settings.setCacheMode(WebSettings.LOAD_NO_CACHE);
            settings.setMediaPlaybackRequiresUserGesture(false);
            webView.clearCache(true);
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

                @Override
                public void onGeolocationPermissionsShowPrompt(
                    final String origin,
                    final GeolocationPermissions.Callback callback
                ) {
                    if (callback != null) {
                        callback.invoke(origin, true, false);
                    }
                }

                @Override
                public boolean onShowFileChooser(
                    final WebView webView,
                    final android.webkit.ValueCallback<Uri[]> filePathCallback,
                    final FileChooserParams fileChooserParams
                ) {
                    if (fileUploadCallback != null) {
                        try {
                            fileUploadCallback.onReceiveValue(null);
                        } catch (Exception ignored) {
                        }
                        fileUploadCallback = null;
                    }
                    fileUploadCallback = filePathCallback;

                    try {
                        Intent contentSelectionIntent = new Intent(Intent.ACTION_GET_CONTENT);
                        contentSelectionIntent.addCategory(Intent.CATEGORY_OPENABLE);
                        contentSelectionIntent.setType("image/*");
                        contentSelectionIntent.putExtra(
                            Intent.EXTRA_MIME_TYPES,
                            new String[] { "image/jpeg", "image/png", "image/webp", "image/*" }
                        );

                        Intent pickIntent = new Intent(
                            Intent.ACTION_PICK,
                            MediaStore.Images.Media.EXTERNAL_CONTENT_URI
                        );
                        pickIntent.setType("image/*");

                        Intent chooserIntent = Intent.createChooser(
                            contentSelectionIntent,
                            "Selecionar Imagem na Galeria"
                        );
                        chooserIntent.putExtra(
                            Intent.EXTRA_INITIAL_INTENTS,
                            new Intent[] { pickIntent }
                        );

                        isOpeningSystemPicker = true;
                        startActivityForResult(chooserIntent, FILE_CHOOSER_REQUEST_CODE);
                        return true;
                    } catch (Exception e) {
                        isOpeningSystemPicker = false;
                        if (fileUploadCallback != null) {
                            try {
                                fileUploadCallback.onReceiveValue(null);
                            } catch (Exception ignored) {
                            }
                            fileUploadCallback = null;
                        }
                        return false;
                    }
                }
            });

            // Automatic Live OTA check on startup: load https://iokmoreira.github.io/Delivery-buddy/ if reachable,
            // otherwise stay on the bundled local Capacitor build (https://localhost) seamlessly!
            checkAndLoadLiveOtaIfOnline(true);
        }
    }

    private void startNativeGpsTrackingIfPermitted() {
        try {
            boolean hasFine = ContextCompat.checkSelfPermission(
                this,
                Manifest.permission.ACCESS_FINE_LOCATION
            ) == PackageManager.PERMISSION_GRANTED;
            boolean hasCoarse = ContextCompat.checkSelfPermission(
                this,
                Manifest.permission.ACCESS_COARSE_LOCATION
            ) == PackageManager.PERMISSION_GRANTED;
            if (!hasFine && !hasCoarse) {
                return;
            }
            if (locationManager == null) {
                locationManager = (LocationManager) getSystemService(Context.LOCATION_SERVICE);
            }
            if (locationManager == null) return;

            if (nativeLocationListener == null) {
                nativeLocationListener = new LocationListener() {
                    @Override
                    public void onLocationChanged(final Location location) {
                        if (location == null) return;
                        dispatchNativeLocationToWebView(location);
                    }

                    @Override
                    public void onStatusChanged(String provider, int status, Bundle extras) {
                    }

                    @Override
                    public void onProviderEnabled(String provider) {
                    }

                    @Override
                    public void onProviderDisabled(String provider) {
                    }
                };
            }

            try {
                if (locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)) {
                    locationManager.requestLocationUpdates(
                        LocationManager.NETWORK_PROVIDER,
                        4000L,
                        10.0f,
                        nativeLocationListener,
                        Looper.getMainLooper()
                    );
                    if (!hasNativeGpsFix) {
                        Location lastNet = locationManager.getLastKnownLocation(LocationManager.NETWORK_PROVIDER);
                        if (lastNet != null) {
                            dispatchNativeLocationToWebView(lastNet);
                        }
                    }
                }
            } catch (Exception ignored) {
            }

            try {
                if (locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER)) {
                    locationManager.requestLocationUpdates(
                        LocationManager.GPS_PROVIDER,
                        2000L,
                        5.0f,
                        nativeLocationListener,
                        Looper.getMainLooper()
                    );
                    Location lastGps = locationManager.getLastKnownLocation(LocationManager.GPS_PROVIDER);
                    if (lastGps != null) {
                        dispatchNativeLocationToWebView(lastGps);
                    }
                }
            } catch (Exception ignored) {
            }

            try {
                if (locationManager.isProviderEnabled(LocationManager.PASSIVE_PROVIDER)) {
                    locationManager.requestLocationUpdates(
                        LocationManager.PASSIVE_PROVIDER,
                        3000L,
                        10.0f,
                        nativeLocationListener,
                        Looper.getMainLooper()
                    );
                    if (!hasNativeGpsFix) {
                        Location lastPassive = locationManager.getLastKnownLocation(LocationManager.PASSIVE_PROVIDER);
                        if (lastPassive != null) {
                            dispatchNativeLocationToWebView(lastPassive);
                        }
                    }
                }
            } catch (Exception ignored) {
            }
        } catch (Exception ignored) {
        }
    }

    private void dispatchNativeLocationToWebView(final Location location) {
        if (location == null) return;
        final double lat = location.getLatitude();
        final double lng = location.getLongitude();
        if (lat == 0.0 && lng == 0.0) return;

        final String provider = location.getProvider() != null
            ? location.getProvider().toLowerCase(Locale.US)
            : "";
        final float accuracy = location.hasAccuracy() ? location.getAccuracy() : 25.0f;
        final float speedMps = location.hasSpeed() ? location.getSpeed() : 0.0f;
        final long nowMs = System.currentTimeMillis();

        final boolean isHighAcc = "gps".equals(provider) || accuracy <= 40.0f;
        if (isHighAcc) {
            hasHighAccuracyNativeGpsFix = true;
            lastHighAccuracyFixTimeMs = nowMs;
        } else if (hasHighAccuracyNativeGpsFix && (nowMs - lastHighAccuracyFixTimeMs < 60000L)) {
            // Once a high-accuracy GPS fix is active, ignore coarse cell-tower / network jumps!
            return;
        }

        // Apply 10-meter minimum movement filter (deadband) after initial fix, unless accuracy improved significantly
        if (hasNativeGpsFix) {
            float[] distMeters = new float[1];
            Location.distanceBetween(lastNativeLat, lastNativeLng, lat, lng, distMeters);
            boolean accuracyImprovedSignificantly = (accuracy + 15.0f < lastNativeAccuracy);
            if (distMeters[0] < 10.0f && !accuracyImprovedSignificantly) {
                return;
            }
        }

        lastNativeLat = lat;
        lastNativeLng = lng;
        lastNativeAccuracy = accuracy;
        hasNativeGpsFix = true;

        if (getBridge() != null && getBridge().getWebView() != null) {
            final WebView webView = getBridge().getWebView();
            webView.post(new Runnable() {
                @Override
                public void run() {
                    String js = String.format(
                        Locale.US,
                        "window.onNativeLocationUpdate && window.onNativeLocationUpdate(%.6f, %.6f, %.1f, %.2f);",
                        lat,
                        lng,
                        accuracy,
                        speedMps
                    );
                    webView.evaluateJavascript(js, null);
                }
            });
        }
    }

    private void notifyWebViewSpeakingState(final boolean speaking) {
        if (getBridge() != null && getBridge().getWebView() != null) {
            final WebView webView = getBridge().getWebView();
            webView.post(new Runnable() {
                @Override
                public void run() {
                    webView.evaluateJavascript(
                        "window.onBuddyNativeSpeakingState && window.onBuddyNativeSpeakingState("
                            + (speaking ? "true" : "false") + ");",
                        null
                    );
                }
            });
        }
    }

    private float activeNativeSpeechRate = 1.15f;

    private void applyMalePtBrVoiceAndRate() {
        if (nativeTts == null) return;
        try {
            Locale ptBrLocale = new Locale("pt", "BR");
            nativeTts.setLanguage(ptBrLocale);

            boolean matchedExplicitMale = false;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                Set<Voice> voices = nativeTts.getVoices();
                if (voices != null) {
                    Voice bestMalePtBr = null;
                    Voice fallbackPtBrNonFemale = null;
                    Voice fallbackPtBr = null;
                    for (Voice v : voices) {
                        if (v == null || v.getLocale() == null) continue;
                        String lang = v.getLocale().getLanguage().toLowerCase(Locale.US);
                        String country = v.getLocale().getCountry().toLowerCase(Locale.US);
                        String vName = v.getName() != null ? v.getName().toLowerCase(Locale.US) : "";
                        if ("pt".equals(lang) && ("br".equals(country) || vName.contains("pt-br") || vName.contains("pt_br"))) {
                            if (fallbackPtBr == null) fallbackPtBr = v;
                            boolean isKnownMale = vName.contains("pt-br-x-pte")
                                || vName.contains("pt-br-x-afs")
                                || vName.contains("pt-br-x-ptd")
                                || vName.contains("pte")
                                || vName.contains("afs")
                                || vName.contains("ptd")
                                || vName.contains("male")
                                || vName.contains("antonio")
                                || vName.contains("daniel")
                                || vName.contains("fabio")
                                || vName.contains("ricardo")
                                || vName.contains("nicolau");
                            boolean isKnownFemale = vName.contains("female")
                                || vName.contains("ptc")
                                || vName.contains("bmg")
                                || vName.contains("francisca")
                                || vName.contains("luciana")
                                || vName.contains("thalita")
                                || vName.contains("vitoria")
                                || vName.contains("camila");
                            if (!isKnownFemale && fallbackPtBrNonFemale == null) {
                                fallbackPtBrNonFemale = v;
                            }
                            if (isKnownMale && !isKnownFemale) {
                                bestMalePtBr = v;
                                if (vName.contains("local") || !v.isNetworkConnectionRequired()) {
                                    break;
                                }
                            }
                        }
                    }
                    if (bestMalePtBr != null) {
                        nativeTts.setVoice(bestMalePtBr);
                        matchedExplicitMale = true;
                    } else if (fallbackPtBrNonFemale != null) {
                        nativeTts.setVoice(fallbackPtBrNonFemale);
                    } else if (fallbackPtBr != null) {
                        nativeTts.setVoice(fallbackPtBr);
                    }
                }
            }

            // Force Male Brazilian Portuguese (pt-BR) timbre (0.92f pitch) and snappy 1.30x speed
            nativeTts.setPitch(matchedExplicitMale ? 0.95f : 0.90f);
            nativeTts.setSpeechRate(activeNativeSpeechRate);
        } catch (Exception ignored) {
        }
    }

    private volatile String pendingTtsText = null;
    private volatile String lastUtteranceId = "";

    private void initNativeTts() {
        try {
            nativeTts = new TextToSpeech(getApplicationContext(), new TextToSpeech.OnInitListener() {
                @Override
                public void onInit(int status) {
                    if (status == TextToSpeech.SUCCESS && nativeTts != null) {
                        applyMalePtBrVoiceAndRate();

                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                            AudioAttributes attrs = new AudioAttributes.Builder()
                                .setUsage(AudioAttributes.USAGE_MEDIA)
                                .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                                .setLegacyStreamType(AudioManager.STREAM_MUSIC)
                                .build();
                            nativeTts.setAudioAttributes(attrs);
                        }

                        nativeTts.setOnUtteranceProgressListener(new UtteranceProgressListener() {
                            @Override
                            public void onStart(String utteranceId) {
                                notifyWebViewSpeakingState(true);
                            }

                            @Override
                            public void onDone(String utteranceId) {
                                if (utteranceId == null || utteranceId.equals(lastUtteranceId)) {
                                    notifyWebViewSpeakingState(false);
                                }
                            }

                            @Override
                            public void onError(String utteranceId) {
                                if (utteranceId == null || utteranceId.equals(lastUtteranceId)) {
                                    notifyWebViewSpeakingState(false);
                                }
                            }
                        });

                        nativeTtsReady = true;
                        final String queued = pendingTtsText;
                        pendingTtsText = null;
                        if (queued != null && !queued.trim().isEmpty()) {
                            speakWithNativeTts(queued);
                        }
                    }
                }
            });
        } catch (Exception ignored) {
        }
    }

    public void stopSpeakingNow() {
        pendingTtsText = null;
        lastUtteranceId = "";
        mainHandler.post(new Runnable() {
            @Override
            public void run() {
                if (nativeTts != null) {
                    try {
                        nativeTts.stop();
                    } catch (Exception ignored) {
                    }
                }
                notifyWebViewSpeakingState(false);
            }
        });
    }

    public void speakWithNativeTts(final String text) {
        if (text == null || text.trim().isEmpty()) return;
        mainHandler.post(new Runnable() {
            @Override
            public void run() {
                try {
                    if (nativeTts == null || !nativeTtsReady) {
                        pendingTtsText = text.trim();
                        return;
                    }
                    pendingTtsText = null;
                    try {
                        nativeTts.stop();
                    } catch (Exception ignored) {
                    }
                    applyMalePtBrVoiceAndRate();
                    final String utteranceId = "buddy_tts_" + System.currentTimeMillis();
                    lastUtteranceId = utteranceId;
                    notifyWebViewSpeakingState(true);
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                        Bundle params = new Bundle();
                        params.putInt(TextToSpeech.Engine.KEY_PARAM_STREAM, AudioManager.STREAM_MUSIC);
                        params.putFloat(TextToSpeech.Engine.KEY_PARAM_VOLUME, 1.0f);
                        nativeTts.speak(
                            text.trim(),
                            TextToSpeech.QUEUE_FLUSH,
                            params,
                            utteranceId
                        );
                    } else {
                        java.util.HashMap<String, String> params = new java.util.HashMap<>();
                        params.put(TextToSpeech.Engine.KEY_PARAM_STREAM, String.valueOf(AudioManager.STREAM_MUSIC));
                        params.put(TextToSpeech.Engine.KEY_PARAM_VOLUME, "1.0");
                        params.put(TextToSpeech.Engine.KEY_PARAM_UTTERANCE_ID, utteranceId);
                        nativeTts.speak(text.trim(), TextToSpeech.QUEUE_FLUSH, params);
                    }
                } catch (Exception ignored) {
                    notifyWebViewSpeakingState(false);
                }
            }
        });
    }

    private void registerScreenshotObserver() {
        try {
            screenshotObserver = new ContentObserver(mainHandler) {
                private long lastShotTs = 0L;
                @Override
                public void onChange(boolean selfChange, Uri uri) {
                    super.onChange(selfChange, uri);
                    long now = System.currentTimeMillis();
                    if (now - lastShotTs < 4000L) return;
                    lastShotTs = now;
                    // Notify WebView that a new screenshot was captured while on shift
                    if (getBridge() != null && getBridge().getWebView() != null) {
                        getBridge().getWebView().post(new Runnable() {
                            @Override
                            public void run() {
                                getBridge().getWebView().evaluateJavascript(
                                    "window.onBuddyScreenshotCaptured && window.onBuddyScreenshotCaptured();",
                                    null
                                );
                            }
                        });
                    }
                }
            };
            getContentResolver().registerContentObserver(
                MediaStore.Images.Media.EXTERNAL_CONTENT_URI,
                true,
                screenshotObserver
            );
        } catch (Exception ignored) {
        }
    }

    public static void dispatchAutoDetectedOffer(
        final Context ctx,
        final double euros,
        final double km,
        final String platform
    ) {
        final MainActivity act = getInstance();
        final String safePlatform = (platform != null && !platform.trim().isEmpty()) ? platform.trim() : "Glovo";
        final double netProfit = Math.max(0.20, (euros * 0.85) - (km * 0.16));
        final double netPerKm = netProfit / Math.max(0.1, km);
        final boolean isWorthIt = netPerKm >= 1.10 && netProfit >= 3.50;

        final String eurosStr = String.format(Locale.FRANCE, "%.2f", euros);
        final String kmStr = String.format(Locale.FRANCE, "%.1f", km);
        final String netStr = String.format(Locale.FRANCE, "%.2f", netProfit);
        final String perKmStr = String.format(Locale.FRANCE, "%.2f", netPerKm);

        final int eurosWhole = (int) Math.floor(euros);
        final int eurosCents = (int) Math.round((euros - eurosWhole) * 100);
        final int perKmWhole = (int) Math.floor(netPerKm);
        final int perKmCents = (int) Math.round((netPerKm - perKmWhole) * 100);
        final String eurosSpoken = eurosCents > 0
            ? (eurosWhole + " euros e " + eurosCents)
            : (eurosWhole + " euros");
        final String perKmSpoken = perKmCents > 0
            ? (perKmWhole + " e " + String.format(Locale.US, "%02d", perKmCents))
            : String.valueOf(perKmWhole);

        final String spokenVerdict = isWorthIt
            ? eurosSpoken + ", dá " + perKmSpoken + " por quilômetro. Compensa!"
            : eurosSpoken + ", dá " + perKmSpoken + " por quilômetro. Não compensa!";

        final String bannerToast = (isWorthIt ? "✅ COMPENSA (" : "⚠️ NÃO COMPENSA (")
            + safePlatform + "): " + eurosStr + "€ / " + kmStr + "km → Líq: " + netStr + "€ (" + perKmStr + "€/km)";

        if (act != null) {
            act.mainHandler.post(new Runnable() {
                @Override
                public void run() {
                    try {
                        Toast.makeText(act, bannerToast, Toast.LENGTH_LONG).show();
                    } catch (Exception ignored) {
                    }
                    act.speakWithNativeTts(spokenVerdict);
                    if (!act.isInForeground) {
                        BuddyOverlayService.updateListeningStateWithCaption(act, false, bannerToast);
                    }
                    if (act.getBridge() != null && act.getBridge().getWebView() != null) {
                        final String quotedPlat = JSONObject.quote(safePlatform);
                        final String js = String.format(
                            Locale.US,
                            "window.onAutoOfferDetected && window.onAutoOfferDetected(%.2f, %.2f, %s);",
                            euros,
                            km,
                            quotedPlat
                        );
                        act.getBridge().getWebView().evaluateJavascript(js, null);
                    }
                }
            });
        } else if (ctx != null) {
            new Handler(Looper.getMainLooper()).post(new Runnable() {
                @Override
                public void run() {
                    try {
                        Toast.makeText(ctx.getApplicationContext(), bannerToast, Toast.LENGTH_LONG).show();
                    } catch (Exception ignored) {
                    }
                }
            });
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
        recognizerIntent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, "pt-BR");
        recognizerIntent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_PREFERENCE, "pt-BR");
        recognizerIntent.putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true);
        recognizerIntent.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 3);
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
        // Immediately stop any ongoing speech before opening the microphone
        stopSpeakingNow();

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
        lastPartialTranscript = "";

        try {
            speechRecognizer = SpeechRecognizer.createSpeechRecognizer(MainActivity.this);
            speechRecognizer.setRecognitionListener(new RecognitionListener() {
                @Override
                public void onReadyForSpeech(Bundle params) {
                    isSingleShotListening = true;
                    if (!isInForeground) {
                        BuddyOverlayService.updateListeningStateWithCaption(MainActivity.this, true, "Ouvindo...");
                    }
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
                    // If user spoke partial words before timeout/no-match, process them as final before closing mic!
                    if (lastPartialTranscript != null && !lastPartialTranscript.trim().isEmpty()) {
                        String fallback = lastPartialTranscript.trim();
                        lastPartialTranscript = "";
                        handleRecognizedSpeech(fallback, true);
                    }
                    stopAndReleaseMicrophoneNow();
                }

                @Override
                public void onResults(Bundle results) {
                    String bestText = "";
                    if (results != null) {
                        ArrayList<String> matches = results.getStringArrayList(
                            SpeechRecognizer.RESULTS_RECOGNITION
                        );
                        if (matches != null && !matches.isEmpty() && matches.get(0) != null) {
                            bestText = matches.get(0).trim();
                        }
                    }
                    if (bestText.isEmpty() && lastPartialTranscript != null) {
                        bestText = lastPartialTranscript.trim();
                    }
                    lastPartialTranscript = "";
                    if (!bestText.isEmpty()) {
                        handleRecognizedSpeech(bestText, true);
                    }
                    // Immediately close and release microphone after single command completes
                    stopAndReleaseMicrophoneNow();
                }

                @Override
                public void onPartialResults(Bundle partialResults) {
                    if (!isSingleShotListening || partialResults == null) return;
                    StringBuilder sb = new StringBuilder();
                    ArrayList<String> partials = partialResults.getStringArrayList(
                        SpeechRecognizer.RESULTS_RECOGNITION
                    );
                    if (partials != null && !partials.isEmpty() && partials.get(0) != null) {
                        sb.append(partials.get(0).trim());
                    }
                    ArrayList<String> unstable = partialResults.getStringArrayList(
                        "android.speech.extra.UNSTABLE_TEXT"
                    );
                    if (unstable != null && !unstable.isEmpty() && unstable.get(0) != null) {
                        String u = unstable.get(0).trim();
                        if (!u.isEmpty()) {
                            if (sb.length() > 0) sb.append(" ");
                            sb.append(u);
                        }
                    }
                    String combinedPartial = sb.toString().trim();
                    if (!combinedPartial.isEmpty()) {
                        lastPartialTranscript = combinedPartial;
                        if (!isInForeground) {
                            BuddyOverlayService.updateListeningStateWithCaption(
                                MainActivity.this,
                                true,
                                combinedPartial
                            );
                        }
                        handleRecognizedSpeech(combinedPartial, false);
                    }
                }

                @Override
                public void onEvent(int eventType, Bundle params) {
                }
            });

            isSingleShotListening = true;
            if (!isInForeground) {
                BuddyOverlayService.updateListeningStateWithCaption(MainActivity.this, true, "Ouvindo...");
            }
            notifyWebViewListeningState(true);
            speechRecognizer.startListening(recognizerIntent);

            // 7.5-second maximum single-shot watchdog
            mainHandler.removeCallbacks(singleShotTimeoutRunnable);
            mainHandler.postDelayed(singleShotTimeoutRunnable, 7500L);
        } catch (Exception e) {
            stopAndReleaseMicrophoneNow();
        }
    }

    private void stopAndReleaseMicrophoneNow() {
        isSingleShotListening = false;
        mainHandler.removeCallbacks(singleShotTimeoutRunnable);
        destroySpeechRecognizerInternal();
        if (!isInForeground) {
            BuddyOverlayService.updateListeningStateWithCaption(MainActivity.this, false, "");
        } else {
            BuddyOverlayService.hideBubble(MainActivity.this);
        }
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

    private boolean isMinimizeCommand(String norm) {
        return norm.contains("minimizar")
            || norm.contains("minimizer")
            || norm.contains("minimiz")
            || norm.contains("modo invisivel")
            || norm.contains("esconder")
            || norm.contains("ocultar")
            || norm.contains("bolinha");
    }

    private boolean isWakeOrForegroundCommand(String norm) {
        return norm.contains("maximizar")
            || norm.contains("maximizer")
            || norm.contains("maximiz")
            || norm.contains("abrir")
            || norm.contains("voltar")
            || norm.contains("mostrar")
            || norm.contains("restaurar")
            || norm.contains("ecra")
            || norm.contains("tela")
            || norm.contains("inicio")
            || norm.contains("home")
            || norm.contains("oferta")
            || norm.contains("clima")
            || norm.contains("tempo")
            || norm.contains("meteorologia")
            || norm.contains("chuva")
            || norm.contains("temperatura")
            || norm.contains("graus")
            || norm.contains("finan")
            || norm.contains("ganho")
            || norm.contains("lucro")
            || norm.contains("dinheiro")
            || norm.contains("carteira")
            || norm.contains("mapa")
            || norm.contains("zona")
            || norm.contains("onde")
            || norm.contains("radar")
            || norm.contains("buddy")
            || norm.contains("comunidade")
            || norm.contains("colega")
            || norm.contains("ajust")
            || norm.contains("config")
            || norm.contains("defin")
            || norm.contains("scanner")
            || norm.contains("dividir")
            || norm.contains("peso")
            || norm.contains("pesado")
            || norm.contains("quilos")
            || norm.contains("suporte")
            || norm.contains("noturno")
            || norm.contains("escuro")
            || norm.contains("noite")
            || norm.contains("claro")
            || norm.contains("dia")
            || norm.contains("sos")
            || norm.contains("emerg")
            || norm.contains("socorro")
            || norm.contains("ajuda")
            || norm.contains("acidente");
    }

    private boolean isActionableFastCommand(String norm) {
        return isMinimizeCommand(norm)
            || isWakeOrForegroundCommand(norm)
            || norm.contains("aceitar")
            || norm.contains("recusar")
            || norm.contains("rejeitar")
            || norm.contains("iniciar entrega")
            || norm.contains("finalizar entrega")
            || norm.contains("modo chuva")
            || norm.contains("gastei");
    }

    private void handleRecognizedSpeech(final String text, final boolean isFinal) {
        if (text == null || text.trim().isEmpty()) return;

        final String cleanText = text.trim();
        String norm = normalizeText(cleanText);
        long now = SystemClock.uptimeMillis();
        boolean matchedFastCmd = isActionableFastCommand(norm);

        // Always stream partial & final transcripts to WebView when in foreground so live banner updates word-by-word
        if (isInForeground && getBridge() != null && getBridge().getWebView() != null) {
            final WebView webView = getBridge().getWebView();
            final boolean treatAsFinal = isFinal || matchedFastCmd;
            webView.post(new Runnable() {
                @Override
                public void run() {
                    String quoted = JSONObject.quote(cleanText);
                    String js = "window.onBuddyNativeTranscript && window.onBuddyNativeTranscript("
                        + quoted + ", " + (treatAsFinal ? "true" : "false") + ");";
                    webView.evaluateJavascript(js, null);
                }
            });
        }

        // Execute native window minimize/maximize & background wake directly in Java!
        if (now - lastDirectJavaCommandTs > 1500L) {
            if (isMinimizeCommand(norm)) {
                lastDirectJavaCommandTs = now;
                lastPartialTranscript = "";
                stopAndReleaseMicrophoneNow();
                minimizeToFloatingBubbleNow();
                return;
            } else if (!isInForeground && (isWakeOrForegroundCommand(norm) || isFinal)) {
                // App is minimized on the Home Screen and user spoke a wake/clima/tab command into the DB bubble!
                lastDirectJavaCommandTs = now;
                lastPartialTranscript = "";
                pendingWakeTranscript = cleanText;
                stopAndReleaseMicrophoneNow();
                bringActivityToFrontNow();
                // Schedule delayed dispatch once WebView resumes in foreground
                mainHandler.postDelayed(new Runnable() {
                    @Override
                    public void run() {
                        flushPendingWakeTranscriptToWebView();
                    }
                }, 220L);
                mainHandler.postDelayed(new Runnable() {
                    @Override
                    public void run() {
                        flushPendingWakeTranscriptToWebView();
                    }
                }, 550L);
                return;
            } else if (norm.contains("maximizar")
                || norm.contains("maximizer")
                || norm.contains("maximiz")
                || norm.contains("abrir")
                || norm.contains("mostrar tela")
                || norm.contains("restaurar")) {
                lastDirectJavaCommandTs = now;
                lastPartialTranscript = "";
                stopAndReleaseMicrophoneNow();
                bringActivityToFrontNow();
                return;
            } else if (matchedFastCmd) {
                lastDirectJavaCommandTs = now;
                lastPartialTranscript = "";
                stopAndReleaseMicrophoneNow();
                return;
            }
        }
    }

    private void flushPendingWakeTranscriptToWebView() {
        if (pendingWakeTranscript == null || pendingWakeTranscript.trim().isEmpty()) return;
        if (getBridge() != null && getBridge().getWebView() != null) {
            final String cmdToDispatch = pendingWakeTranscript.trim();
            pendingWakeTranscript = null;
            final WebView webView = getBridge().getWebView();
            webView.post(new Runnable() {
                @Override
                public void run() {
                    String quoted = JSONObject.quote(cmdToDispatch);
                    String js = "window.__onNativeBubbleRestore && window.__onNativeBubbleRestore();"
                        + "window.onBuddyNativeTranscript && window.onBuddyNativeTranscript("
                        + quoted + ", true);";
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
                        "window.playBuddyOpenChime && window.playBuddyOpenChime();"
                            + "window.__onNativeBubbleRestore && window.__onNativeBubbleRestore();",
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
                    wasMinimizedToBubble = true;
                    isInForeground = false;
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
                // If already in foreground, just hide any stray overlay bubble and do NOT re-launch Activity!
                if (isInForeground && !wasMinimizedToBubble) {
                    BuddyOverlayService.hideBubble(MainActivity.this);
                    return;
                }

                // Delegate foreground launch to BuddyOverlayService while its overlay window is active
                BuddyOverlayService.wakeAndMaximizeActivity(MainActivity.this);

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
        BuddyOverlayService.hideBubble(this);
        if (intent != null && intent.getBooleanExtra("RESTORE_FROM_BUBBLE", false)) {
            if (wasMinimizedToBubble) {
                wasMinimizedToBubble = false;
                notifyRestoredFromBubble();
            }
            mainHandler.postDelayed(new Runnable() {
                @Override
                public void run() {
                    flushPendingWakeTranscriptToWebView();
                }
            }, 150L);
        }
    }

    @Override
    @SuppressWarnings("deprecation")
    public void onBackPressed() {
        minimizeToFloatingBubbleNow();
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) {
            isInForeground = true;
            BuddyOverlayService.hideBubble(this);
        }
    }

    @Override
    @SuppressWarnings("deprecation")
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        if (requestCode == FILE_CHOOSER_REQUEST_CODE) {
            isOpeningSystemPicker = false;
            if (fileUploadCallback != null) {
                Uri[] results = null;
                try {
                    if (resultCode == android.app.Activity.RESULT_OK && data != null) {
                        String dataString = data.getDataString();
                        android.content.ClipData clipData = data.getClipData();
                        if (clipData != null && clipData.getItemCount() > 0) {
                            results = new Uri[clipData.getItemCount()];
                            for (int i = 0; i < clipData.getItemCount(); i++) {
                                results[i] = clipData.getItemAt(i).getUri();
                            }
                        } else if (dataString != null) {
                            results = new Uri[] { Uri.parse(dataString) };
                        } else if (data.getData() != null) {
                            results = new Uri[] { data.getData() };
                        }
                    }
                } catch (Exception ignored) {
                }
                try {
                    fileUploadCallback.onReceiveValue(results);
                } catch (Exception ignored) {
                }
                fileUploadCallback = null;
            }
            return;
        }
        super.onActivityResult(requestCode, resultCode, data);
    }

    @Override
    public void onResume() {
        super.onResume();
        isOpeningSystemPicker = false;
        boolean cameFromBubble = wasMinimizedToBubble;
        isInForeground = true;
        wasMinimizedToBubble = false;
        BuddyOverlayService.hideBubble(this);
        if (cameFromBubble) {
            notifyRestoredFromBubble();
        }
        startNativeGpsTrackingIfPermitted();
        if (pendingWakeTranscript != null) {
            mainHandler.postDelayed(new Runnable() {
                @Override
                public void run() {
                    flushPendingWakeTranscriptToWebView();
                }
            }, 150L);
        }
    }

    @Override
    public void onRequestPermissionsResult(
        int requestCode,
        String[] permissions,
        int[] grantResults
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        startNativeGpsTrackingIfPermitted();
    }

    @Override
    public void onPause() {
        super.onPause();
        // Do NOT show the native overlay bubble in onPause() while MainActivity is still visible on screen!
        // Showing the bubble in onPause() caused duplicate bubbles when system dialogs or speech recognition opened.
    }

    @Override
    public void onStop() {
        super.onStop();
        if (isOpeningSystemPicker) {
            return;
        }
        isInForeground = false;
        wasMinimizedToBubble = true;
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M || Settings.canDrawOverlays(this)) {
            BuddyOverlayService.showBubble(this, isSingleShotListening);
        }
    }

    @Override
    public void onDestroy() {
        stopAndReleaseMicrophoneNow();
        if (locationManager != null && nativeLocationListener != null) {
            try {
                locationManager.removeUpdates(nativeLocationListener);
            } catch (Exception ignored) {
            }
        }
        if (screenshotObserver != null) {
            try {
                getContentResolver().unregisterContentObserver(screenshotObserver);
            } catch (Exception ignored) {
            }
            screenshotObserver = null;
        }
        if (nativeTts != null) {
            try {
                nativeTts.stop();
                nativeTts.shutdown();
            } catch (Exception ignored) {
            }
            nativeTts = null;
        }
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
        public void startSingleShotVoice() {
            mainHandler.post(new Runnable() {
                @Override
                public void run() {
                    startSingleShotVoiceRecognition();
                }
            });
        }

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
                    } else if (!isInForeground) {
                        BuddyOverlayService.updateListeningState(MainActivity.this, true);
                    }
                }
            });
        }

        @JavascriptInterface
        public int getNativeBridgeVersion() {
            return 12;
        }

        @JavascriptInterface
        public void openExternalBrowser(final String url) {
            if (url == null || url.trim().isEmpty()) return;
            mainHandler.post(new Runnable() {
                @Override
                public void run() {
                    try {
                        isOpeningSystemPicker = true;
                        Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url.trim()));
                        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                        startActivity(intent);
                    } catch (Exception ignored) {
                        isOpeningSystemPicker = false;
                    }
                }
            });
        }

        @JavascriptInterface
        public void setSpeechRate(final float rate) {
            mainHandler.post(new Runnable() {
                @Override
                public void run() {
                    float clamped = Math.max(1.0f, Math.min(1.5f, rate));
                    activeNativeSpeechRate = clamped;
                    if (nativeTts != null && nativeTtsReady) {
                        try {
                            nativeTts.setSpeechRate(clamped);
                        } catch (Exception ignored) {
                        }
                    }
                }
            });
        }

        @JavascriptInterface
        public void speakText(final String text) {
            speakWithNativeTts(text);
        }

        @JavascriptInterface
        public void speakNativeTts(final String text) {
            speakWithNativeTts(text);
        }

        @JavascriptInterface
        public void stopSpeaking() {
            stopSpeakingNow();
        }

        @JavascriptInterface
        public void stopNativeTts() {
            stopSpeakingNow();
        }

        @JavascriptInterface
        public void openAccessibilitySettings() {
            mainHandler.post(new Runnable() {
                @Override
                public void run() {
                    try {
                        Intent intent = new Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS);
                        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                        startActivity(intent);
                    } catch (Exception ignored) {
                    }
                }
            });
        }

        @JavascriptInterface
        public boolean isAutoOfferDetectorEnabled() {
            return BuddyOfferDetectorService.isServiceRunning();
        }

        @JavascriptInterface
        public void simulateIncomingAutoOffer(final double euros, final double km, final String platform) {
            dispatchAutoDetectedOffer(MainActivity.this, euros, km, platform);
        }

        @JavascriptInterface
        public void reloadOtaNow() {
            checkAndLoadLiveOtaIfOnline(true);
        }

        @JavascriptInterface
        public void requestImmediateNativeGpsFix() {
            mainHandler.post(new Runnable() {
                @Override
                public void run() {
                    startNativeGpsTrackingIfPermitted();
                    if (hasNativeGpsFix && getBridge() != null && getBridge().getWebView() != null) {
                        final WebView webView = getBridge().getWebView();
                        String js = String.format(
                            Locale.US,
                            "window.onNativeLocationUpdate && window.onNativeLocationUpdate(%.6f, %.6f, %.1f, 0.0);",
                            lastNativeLat,
                            lastNativeLng,
                            lastNativeAccuracy
                        );
                        webView.evaluateJavascript(js, null);
                    }
                }
            });
        }

        @JavascriptInterface
        public void setBubbleMascotImages(
            final String inactiveB64,
            final String activeB64,
            final String deliveryB64
        ) {
            mainHandler.post(new Runnable() {
                @Override
                public void run() {
                    BuddyOverlayService.setBubbleMascotImages(
                        MainActivity.this,
                        inactiveB64,
                        activeB64,
                        deliveryB64
                    );
                }
            });
        }

        @JavascriptInterface
        public void setBubbleMascotState(final String state) {
            mainHandler.post(new Runnable() {
                @Override
                public void run() {
                    BuddyOverlayService.setBubbleMascotState(MainActivity.this, state);
                }
            });
        }

        @JavascriptInterface
        public void setBubbleRestingPreset(final String preset) {
            mainHandler.post(new Runnable() {
                @Override
                public void run() {
                    BuddyOverlayService.setBubbleRestingPreset(MainActivity.this, preset);
                }
            });
        }
    }
}
