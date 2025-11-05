import { type Request, type Response } from "express";
import { config } from "../config.js";
import {
  processImageMessage,
  processIncomingMessage,
  processAudioMessage,
} from "./message.service.js";
import { type WhatsAppWebhookBody, type ApiPayload } from "./message.types.js";
// Importamos los servicios que necesita la Función 2 (envío humano)
import { sendWhatsAppMessage } from "../service/meta.client.js";
import { saveMessage } from "../service/localApi.client.js";

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
  //console.log(JSON.stringify(body, null, 2));

  try {
    if (body.object === "whatsapp_business_account") {
      const message = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
      const contact = body.entry?.[0]?.changes?.[0]?.value?.contacts?.[0];

      if (message) {
        const phone = message.from;
        const name = contact?.profile?.name || "Usuario"; // Fallback

        //Que hace segun el tipo de mensaje
        switch (message.type) {
          case "text":
            const content = message.text.body;
            processIncomingMessage(phone, content, name);
            break;

          case "image":
            const imageId = message.image.id; //obtener la id de la imagen
            const caption = message.image.caption || "";
            console.log(
              `Mensaje de IMAGEN recibido de ${name}. ID: ${imageId}`
            );
            // Llamamos a una nueva función para manejar imágenes

            processImageMessage(phone, imageId, name, caption);
            break;

          case "audio":
            const audioId = message.audio.id; //obtener la id del audio
            console.log(`Mensaje de AUDIO recibido de ${name}. ID: ${audioId}`);
            processAudioMessage(phone, audioId, name);
            break;

          /*case "video":
              const videoId = message.video.id; //obtener la id del video
              console.log(`Mensaje de VIDEO recibido de ${name}. ID: ${videoId}`);
              processVideoMessage(phone, videoId, name);
              break;*/

          default:
            console.warn(`Tipo de mensaje no manejado:`);
            break;
        }
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

// 3. Envio respuesta Humana, este EndPoit lo ocupa el front
export async function sendHumanResponse(req: Request, res: Response) {
  try {
    //El front envia el numero el texto y el nombre
    const { phone, content, file } = req.body;

    if (!phone || !content) {
      return res
        .status(400)
        .send({ error: "Faltan 'phone' y 'text' en el body" });
    }

    // 1. Enviar el mensaje humano a WhatsApp
    await sendWhatsAppMessage(phone, content);

    const payload: ApiPayload = {
      senderType: "admin",
      phone: phone,
      name: "admin aqc",
      content: content,
      file: file,
    };
    await saveMessage(payload);

    // 3. Responder al Front-End que todo salió bien
    res
      .status(200)
      .send({ success: true, message: "Mensaje humano enviado y guardado." });
  } catch (error) {
    console.error("Error al enviar mensaje humano:", error);
    res.status(500).send({ error: "Error al enviar mensaje humano" });
  }
}
