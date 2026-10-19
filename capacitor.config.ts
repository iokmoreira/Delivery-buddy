export interface CapacitorServerConfig {
  url?: string;
  cleartext?: boolean;
  androidScheme?: 'http' | 'https';
  allowNavigation?: string[];
}

export interface CapacitorConfig {
  appId: string;
  appName: string;
  webDir: string;
  bundledWebRuntime?: boolean;
  server?: CapacitorServerConfig;
  android?: {
    allowMixedContent?: boolean;
    captureInput?: boolean;
    webContentsDebuggingEnabled?: boolean;
    backgroundColor?: string;
  };
}

declare const process: { env?: Record<string, string | undefined> };

const otaServerUrl =
  typeof process !== 'undefined' && process.env?.CAPACITOR_SERVER_URL
    ? process.env.CAPACITOR_SERVER_URL
    : undefined;

const config: CapacitorConfig = {
  appId: 'com.pbg.deliverybuddy',
  appName: 'Delivery Buddy',
  webDir: 'dist',
  server: {
    ...(otaServerUrl ? { url: otaServerUrl, cleartext: true } : {}),
    androidScheme: 'https',
    allowNavigation: ['*'],
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true,
    backgroundColor: '#00000000',
  },
};

export default config;
