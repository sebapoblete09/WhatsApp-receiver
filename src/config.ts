import * as dotenv from "dotenv";
dotenv.config();

// Objeto de configuración validado
export const config = {
  port: process.env.PORT || 8000,

  // Tokens y Endpoints
  metaVerifyToken: process.env.META_VERIFY_TOKEN,
  localApiEndpoint: process.env.LOCAL_API_ENDPOINT,
  metaAccessToken: process.env.ACCESS_TOKEN,
  metaPhoneNumberId: process.env.PHONE_NUMBER_ID,
  geminiApiKey: process.env.GEMINI_API_KEY,
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
if (!config.geminiApiKey) {
  throw new Error("GEMINI_API_KEY no está definido en .env");
}
