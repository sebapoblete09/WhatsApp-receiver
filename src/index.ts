// src/index.ts
import express, { type Request, type Response } from "express";
import * as dotenv from "dotenv";

dotenv.config(); // Cargar las variables de .env

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 8000;
const VERIFY_TOKEN = process.env.META_VERIFY_TOKEN;
const LOCAL_API_ENDPOINT = process.env.LOCAL_API_ENDPOINT;

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
  const senderUser = "user";
  const senderAI = "ai";
  const body = req.body;
  console.log(JSON.stringify(body, null, 2));

  try {
    if (body.object === "whatsapp_business_account") {
      const message = body.entry[0].changes[0].value.messages[0];
      const phone = message.from;
      const content = message.text.body;
      const name = body.entry[0].changes[0].value.contacts[0].profile.name;

      console.log(`Mensaje de ${phone}: ${content}`);

      //1. Enviar a la api el mensaje del cliente
      await saveMessageToApi(phone, content, senderUser, name);

      // 2. Responder al usuario
      const botResponse = "¡Hola! Recibí tu mensaje. 🤖";
      await sendWhatsAppMessage(phone, botResponse);

      //3. Enviar respuesta a la Api
      await saveMessageToApi(phone, botResponse, senderAI, name);

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

// --- 4. Guardar mensaje en Api
async function saveMessageToApi(
  phone: string,
  content: string,
  sender: string,
  name: String
) {
  if (!LOCAL_API_ENDPOINT) {
    console.error(
      "Error: LOCAL_API_ENDPOINT no está definido en el archivo .env"
    );
    return; // Salir de la función si la URL no existe
  }

  // El endpoint que te pasó tu compañero (ahora desde .env)
  const url = LOCAL_API_ENDPOINT;

  const payload = {
    senderType: sender,
    phone: phone,
    name: name, // Puedes ajustar esto según tus necesidades
    content: content,
  };

  console.log("Enviando a Api:", JSON.stringify(payload, null, 2));

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        //agregar a futuro autorizacion
        // 'Authorization': 'Bearer TU_API_KEY_LOCAL'
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error(
        "Error al guardar mensaje en Api:",
        JSON.stringify(errorData, null, 2)
      );
    } else {
      const data = await response.json();
      console.log("¡Mensaje guardado en API local exitosamente!", data);
    }
  } catch (error) {
    console.error("Excepción al conectar con API :", error);
  }
}

app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});
