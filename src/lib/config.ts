/**
 * Application environment configuration
 * Reads environment variables configured via .env / Vite
 */
export const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000",
  apiUrl: import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api",
  appName: import.meta.env.VITE_APP_NAME || "Archivum",
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
} as const;

export default config;
