import { sendWhatsAppMessage } from "../service/meta.client.js";
import { saveMessageToApi } from "../service/localApi.client.js";
import { generateFreeResponse } from "../service/gemini.client.js";

// El "Caso de Uso" principal: Procesar un mensaje entrante
export async function processIncomingMessage(
  phone: string,
  content: string,
  name: string
) {
  try {
    // 1. Enviar a la api el mensaje del cliente
    await saveMessageToApi({
      senderType: "user",
      phone: phone,
      name: name,
      content: content,
    });

    // 2. (MODIFICADO) Generar la respuesta de la IA
    console.log(`Generando respuesta para: "${content}"`);
    const botResponse = await generateFreeResponse(content);

    await sendWhatsAppMessage(phone, botResponse);

    // 3. Enviar respuesta a la Api
    await saveMessageToApi({
      senderType: "ai",
      phone: phone,
      name: name,
      content: botResponse,
    });
  } catch (error) {
    console.error("Error en el servicio de procesamiento de mensajes:", error);
  }
}
