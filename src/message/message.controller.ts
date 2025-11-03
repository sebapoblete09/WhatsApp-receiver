import { type Request, type Response } from "express";
import { config } from "../config.js";
import { processIncomingMessage } from "./message.service.js";
import { type WhatsAppWebhookBody } from "./message.types.js";

// 1. VERIFICACIÓN DEL WEBHOOK (GET)
export function verifyWebhook(req: Request, res: Response) {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === config.metaVerifyToken) {
    console.log("WEBHOOK_VERIFIED");
    res.status(200).send(challenge);
  } else {
    console.error("Failed webhook verification");
    res.status(403).send("Forbidden");
  }
}

// 2. RECEPCIÓN DE MENSAJES (POST)
export async function handleWebhook(req: Request, res: Response) {
  const body = req.body as WhatsAppWebhookBody;
  console.log(JSON.stringify(body, null, 2));

  try {
    if (body.object === "whatsapp_business_account") {
      const message = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
      const contact = body.entry?.[0]?.changes?.[0]?.value?.contacts?.[0];

      // Asegurarse de que es un mensaje de texto válido
      if (message && message.text) {
        const phone = message.from;
        const content = message.text.body;
        const name = contact?.profile?.name || "Usuario"; // Fallback por si no viene el nombre

        // Llamamos al servicio para que haga el trabajo
        // Usamos 'await' para asegurar que se procese, pero no bloqueamos la respuesta a Meta
        processIncomingMessage(phone, content, name);
      }
    }

    // Responde 200 OK a Meta INMEDIATAMENTE
    res.status(200).send("EVENT_RECEIVED");
  } catch (error) {
    console.error("Error procesando el mensaje:", error);
    // Respondemos 200 OK igualmente para que Meta no reintente
    res.status(200).send("EVENT_RECEIVED_WITH_ERROR");
  }
}
