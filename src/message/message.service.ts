import { sendWhatsAppMessage } from "../service/meta.client.js";
import {
  getConversationStatus,
  saveMessage,
} from "../service/localApi.client.js";
import { type LocalApiPayload } from "./message.types.js";
import { generateFreeResponse } from "../service/gemini.client.js";

/**
 * (Función 1: El Webhook)
 * Procesa un mensaje entrante de WhatsApp.
 */
export async function processIncomingMessage(
  phone: string,
  content: string,
  name: string
) {
  try {
    console.log(`Procesando mensaje de ${phone}...`);

    // 1. (NUEVO) Primero, verificamos el estado de la IA
    // isHumanOverride = true significa que la IA está PAUSADA
    const isHumanOverride = await getConversationStatus(phone);

    // 2. Guardamos el mensaje del usuario SIEMPRE
    const userPayload: LocalApiPayload = {
      senderType: "user",
      phone: phone,
      name: name,
      content: content,
    };
    await saveMessage(userPayload);

    // 3. Lógica condicional
    if (isHumanOverride) {
      // --- IA PAUSADA (humano al control) ---
      console.log(
        `IA pausada para ${phone} (human_override=true). No se responde.`
      );
      // No hacemos nada. El trabajo termina aquí.
      return;
    }

    // --- IA ACTIVA (human_override=false) ---
    console.log(`IA activa para ${phone}. Generando respuesta...`);

    // 4a. Generar la respuesta de la IA
    const botResponse = await generateFreeResponse(content);

    // 4b. Enviar la respuesta de la IA al usuario
    await sendWhatsAppMessage(phone, botResponse);

    // 4c. Guardar la respuesta de la IA
    const aiPayload: LocalApiPayload = {
      senderType: "ai",
      phone: phone,
      name: "Bot IA",
      content: botResponse,
    };
    await saveMessage(aiPayload); // Usamos la nueva función simple
  } catch (error) {
    console.error("Error en el servicio de procesamiento de mensajes:", error);
  }
}
