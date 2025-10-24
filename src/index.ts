// src/index.ts
import express, { type Request, type Response } from "express";
import * as dotenv from "dotenv";

dotenv.config(); // Cargar las variables de .env

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 8000;
const VERIFY_TOKEN = process.env.META_VERIFY_TOKEN;

// --- 1. VERIFICACIÓN DEL WEBHOOK (GET) ---
app.get("/api/whatsapp", (req: Request, res: Response) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("WEBHOOK_VERIFIED");
    res.status(200).send(challenge);
  } else {
    console.error("Failed webhook verification");
    res.status(403).send("Forbidden");
  }
});

// --- 2. RECEPCIÓN DE MENSAJES (POST) ---
app.post("/api/whatsapp", async (req: Request, res: Response) => {
  const body = req.body;
  console.log(JSON.stringify(body, null, 2));

  try {
    if (body.object === "whatsapp_business_account") {
      const message = body.entry[0].changes[0].value.messages[0];
      const from = message.from;
      const msg_body = message.text.body;

      console.log(`Mensaje de ${from}: ${msg_body}`);

      // --- AQUÍ ESTÁ LA LÓGICA DE RESPUESTA ---

      // 1. Define tu respuesta de "plantilla"
      const botResponse = "¡Hola! Recibí tu mensaje. 🤖";

      // 2. Llama a la función para enviar el mensaje
      await sendWhatsAppMessage(from, botResponse);

      // ----------------------------------------
    }

    // Responde 200 OK a Meta
    res.status(200).send("EVENT_RECEIVED");
  } catch (error) {
    console.error("Error procesando el mensaje:", error);
    res.status(200).send("EVENT_RECEIVED_WITH_ERROR");
  }
});

// --- 3. NUEVA FUNCIÓN PARA ENVIAR MENSAJES ---
async function sendWhatsAppMessage(to: string, text: string) {
  const ACCESS_TOKEN = process.env.ACCESS_TOKEN;
  const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
  const url = `https://graph.facebook.com/v19.0/${PHONE_NUMBER_ID}/messages`;

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${ACCESS_TOKEN}`,
  };

  const body = {
    messaging_product: "whatsapp",
    to: to,
    type: "text",
    text: { body: text },
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error(
        "Error al enviar mensaje:",
        JSON.stringify(errorData, null, 2)
      );
    } else {
      console.log("¡Respuesta enviada exitosamente!");
    }
  } catch (error) {
    console.error("Excepción al enviar mensaje:", error);
  }
}

app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});
