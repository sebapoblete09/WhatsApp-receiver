import express from "express";
import {
  verifyWebhook,
  handleWebhook,
  sendHumanResponse,
} from "./message/message.controller.js";

const app = express();

// Middlewares
app.use(express.json());

// Rutas
app.get("/api/whatsapp", verifyWebhook);
app.post("/api/whatsapp", handleWebhook);
app.post("/api/human-response", sendHumanResponse); // Endpoint para respuestas humanas

export { app };
