import * as dotenv from "dotenv";
dotenv.config();

// Objeto de configuración validado
export const config = {
  port: process.env.PORT || 8000,

  // Tokens y Endpoints
  // Meta y API Local
  metaVerifyToken: process.env.META_VERIFY_TOKEN,
  localApiEndpoint: process.env.LOCAL_API_ENDPOINT,
  metaAccessToken: process.env.ACCESS_TOKEN,
  metaPhoneNumberId: process.env.PHONE_NUMBER_ID,

  // (MODIFICADO) Vertex AI / GCP
  // (Borramos 'geminiApiKey')
  geminiApiKey: process.env.GEMINI_API_KEY,
  gcpProjectId: process.env.GCP_PROJECT_ID,
  gcpLocation: process.env.GCP_LOCATION,
  gcpDataStoreId: process.env.DATA_STORE_ID,

  // Supabase
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY,
};

// Validación: Nos aseguramos de que las variables críticas existan al iniciar
if (!config.metaVerifyToken) {
  throw new Error("META_VERIFY_TOKEN no está definido en .env");
}
if (!config.localApiEndpoint) {
  throw new Error("LOCAL_API_ENDPOINT no está definido en .env");
}
if (!config.metaAccessToken) {
  throw new Error("ACCESS_TOKEN no está definido en .env");
}
if (!config.metaPhoneNumberId) {
  throw new Error("PHONE_NUMBER_ID no está definido en .env");
}

if (!config.supabaseUrl) {
  throw new Error("SUPABASE_URL no está definido en .env");
}
if (!config.supabaseServiceKey) {
  throw new Error("SUPABASE_SERVICE_KEY no está definido en .env");
}

// (MODIFICADO) Validación de GCP
if (!config.gcpProjectId) {
  throw new Error("GCP_PROJECT_ID no está definido en .env");
}
if (!config.gcpLocation) {
  throw new Error("GCP_LOCATION no está definido en .env");
}
