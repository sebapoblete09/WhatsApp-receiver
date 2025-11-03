import express from "express";
import { verifyWebhook, handleWebhook } from "./message/message.controller.js";

const app = express();

// Middlewares
app.use(express.json());

// Rutas
app.get("/api/whatsapp", verifyWebhook);
app.post("/api/whatsapp", handleWebhook);

export { app };
