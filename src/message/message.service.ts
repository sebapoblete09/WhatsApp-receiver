import {
  downloadMedia,
  getMediaDownloadUrl,
  sendWhatsAppMessage,
} from "../service/meta.client.js";
import {
  getConversationData,
  saveMessage,
  sendAlert,
} from "../service/localApi.client.js";
import { type ApiPayload, type sendPayload } from "./message.types.js";
import {
  classifyImage,
  generateFreeResponse,
  generateImageResponse,
} from "../service/gemini.client.js";
//---- (FUNCION 1: MENSAJE COMO TEXTO) ------ //
//----- Procesa un mensaje de texto entrante de WhatsApp. ----//

export async function processIncomingMessage(
  phone: string,
  content: string,
  name: string
) {
  try {
    console.log(`Procesando mensaje de ${phone}...`);

    // 1. Primero, verificamos el estado de la IA
    // isHumanOverride = true significa que la IA está PAUSADA
    const data = await getConversationData(phone);

    // 2. Guardamos el mensaje del usuario SIEMPRE
    const userPayload: ApiPayload = {
      senderType: "user",
      phone: phone,
      name: name,
      content: content,
    };
    await saveMessage(userPayload);

    // 3. Lógica condicional
    if (data.human_override) {
      // --- IA PAUSADA (humano al control) ---
      console.log(
        `IA pausada para ${phone} (human_override=true). No se responde. \n---------------`
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
    const aiPayload: ApiPayload = {
      senderType: "ai",
      phone: phone,
      name: "Bot IA",
      content: botResponse,
    };
    await saveMessage(aiPayload);
    console.log("-----------------------------"); // Usamos la nueva función simple
  } catch (error) {
    console.error("Error en el servicio de procesamiento de mensajes:", error);
  }
}

export async function processImageMessage(
  phone: string,
  imageId: string,
  name: string,
  content: string
) {
  console.log(`Procesando imagen ${imageId} de ${name}...`);

  try {
    // 1. Verificamos el estado de la IA (Lógica de Pausa)
    const data = await getConversationData(phone);

    // 2. Descargar la imagen de Meta
    const downloadUrl = await getMediaDownloadUrl(imageId);

    if (!downloadUrl) {
      console.error("No se pudo obtener la URL de la imagen.");
      return;
    }

    const imageBuffer = await downloadMedia(downloadUrl);

    if (!imageBuffer) {
      console.error("No se pudo descargar la imagen.");
      return;
    }

    console.log(`Imagen descargada.`);

    // 3. Guardamos el mensaje de IMAGEN del usuario (Tu petición)
    const userPayload: ApiPayload = {
      senderType: "user",
      phone: phone,
      name: name,
      content: content,
      file: {
        // Sin contenido de texto (o podrías poner "Imagen adjunta")
        data: imageBuffer.data, // El ArrayBuffer
        filename: `${imageId}.jpg`, // Un nombre de archivo genérico
        mimeType: imageBuffer.mimeType, // El tipo de imagen real
      },
    };

    // ¡Aquí pasamos el archivo a saveMessage!
    await saveMessage(userPayload);

    // 4. Lógica condicional (Pausa)
    if (data.human_override) {
      console.log(`IA pausada para ${phone}. No se responde a la imagen.`);
      return;
    }

    // --- 5. ¡AQUÍ ESTÁ LA NUEVA LÓGICA! ---
    console.log(`IA activa para ${phone}. Analizando imagen...`);
    // 5a. Convertir el ArrayBuffer a base64
    // Node.js usa 'Buffer' para esto.
    const imageBase64 = Buffer.from(imageBuffer.data).toString("base64");

    // 5c. Generar la respuesta de la IA (¡usando la nueva función!)
    const imageCategory = await classifyImage(
      imageBase64,
      imageBuffer.mimeType
    );
    console.log(`Categoría de imagen detectada: ${imageCategory}`);
    console.log(data.id);

    switch (imageCategory) {
      case "COMPROBANTE":
        console.log(`La imagen de ${phone} es un comprobante.`);

        const botResponse =
          "Hemos recibido tu comprobante, Un ejecutivo lo verificará a la brevedad.";
        await sendWhatsAppMessage(phone, botResponse);
        // 5e. Guardar la respuesta de la IA
        const aiPayload: ApiPayload = {
          senderType: "ai",
          phone: phone,
          name: "Bot IA",
          content: botResponse,
        };
        await saveMessage(aiPayload);

        const sendPayload: sendPayload = {
          conversationId: data.id || "",
          needsHuman: true,
          reason: imageCategory,
        };

        const res = await sendAlert(sendPayload);
        console.log("Alerta enviada: ", res);
        console.log("-----------------------------");

        break;

      case "PROPIEDAD":
        console.log(`La imagen de ${phone} es una propiedad`);
        const Response =
          "Recibí tu foto de la propiedad. ¿Qué necesitas saber o reportar sobre esta imagen, por favor?";

        if (!content) {
          // --- Caso: Foto de propiedad SIN caption ---
          console.log("Caso: PROPIEDAD sin caption.");
          await sendWhatsAppMessage(phone, Response);

          const aiPayload: ApiPayload = {
            senderType: "ai",
            phone: phone,
            name: "Bot IA",
            content: Response,
          };
          await saveMessage(aiPayload);
          console.log("-----------------------------");
          break;
        } else {
          // --- Caso: Foto de propiedad CON caption ---
          console.log(`Caso: PROPIEDAD con caption: "${content}"`);

          // Aquí le pasamos el caption y la imagen a la IA
          const botResponse = await generateImageResponse(
            content, // El caption del usuario es el prompt
            imageBase64,
            imageBuffer.mimeType
          );

          await sendWhatsAppMessage(phone, botResponse);
          const aiPayload: ApiPayload = {
            senderType: "ai",
            phone: phone,
            name: "Bot IA",
            content: Response,
          };
          await saveMessage(aiPayload);
          console.log("-----------------------------");
        }
        break;

      case "OTRO":
      default:
        console.log("Acción: Categoría OTRA. Respondiendo genéricamente.");
        const otherResponse =
          "Recibí tu imagen, pero no estoy seguro de qué hacer con ella. ¿Puedes darme más contexto?";
        await sendWhatsAppMessage(phone, otherResponse);
        const Payload: ApiPayload = {
          senderType: "ai",
          phone: phone,
          name: "Bot IA",
          content: otherResponse,
        };
        await saveMessage(Payload);
        console.log("-----------------------------");
    }
  } catch (error) {
    console.error(`Error al procesar la imagen ${imageId}:`, error);
  }
}

//---- FUNCION 3: MENSAJE COMO AUDIO ------ //
export async function processAudioMessage(
  phone: string,
  audioId: string,
  name: string
) {
  console.log(`Procesando audio ${audioId} de ${name}...`);
  try {
    //ACA VA LA LOGICA PARA DESCARGAR EL AUDIO Y MANDARSELO A SUPABASE, HAY QUE VER SI MANDARSELO COMO AUDIO O TEXTO
    // 1. Verificamos el estado de la IA (Lógica de Pausa)
    const data = await getConversationData(phone);

    // 2. Descargar el audio de Meta
    const downloadUrl = await getMediaDownloadUrl(audioId);

    if (!downloadUrl) {
      console.error("No se pudo obtener la URL de la imagen.");
      return;
    }

    const audioBuffer = await downloadMedia(downloadUrl);

    if (!audioBuffer) {
      console.error("No se pudo descargar el audio.");
      return;
    }

    console.log(`Audio descargado.`);

    // 3. Guardamos el mensaje de IMAGEN del usuario (Tu petición)
    const userPayload: ApiPayload = {
      senderType: "user",
      phone: phone,
      name: name,
      content: "",
      file: {
        // Sin contenido de texto (o podrías poner "Imagen adjunta")
        data: audioBuffer.data, // El ArrayBuffer
        mimeType: audioBuffer.mimeType, // El tipo de audio real
        filename: `${phone}.${audioId}.mp3`, // Un nombre de archivo genérico
      },
    };

    // ¡Aquí pasamos el archivo a saveMessage!
    await saveMessage(userPayload);
    // 4. Lógica condicional (Pausa)
    if (data.human_override) {
      console.log(`IA pausada para ${phone}. No se responde a la imagen.`);
      return;
    }

    console.log("TAREA PENDIENTE: Descargar y procesar audio.");
  } catch (error) {
    console.error(`Error al procesar el audio ${audioId}:`, error);
  }
}

export async function processVideoMessage(
  phone: string,
  videoId: string,
  name: string
) {
  console.log(`Procesando video ${videoId} de ${name}...`);
  try {
    //ACA VA LA LOGICA PARA DESCARGAR EL AUDIO Y MANDARSELO A SUPABASE, HAY QUE VER SI MANDARSELO COMO AUDIO O TEXTO
    // 1. Verificamos el estado de la IA (Lógica de Pausa)
    const data = await getConversationData(phone);

    // 2. Descargar el video de Meta
    const downloadUrl = await getMediaDownloadUrl(videoId);

    if (!downloadUrl) {
      console.error("No se pudo obtener la URL del video.");
      return;
    }

    const audioBuffer = await downloadMedia(downloadUrl);

    if (!audioBuffer) {
      console.error("No se pudo descargar el audio.");
      return;
    }

    console.log(`Audio descargado.`);

    // 3. Guardamos el mensaje de IMAGEN del usuario (Tu petición)
    const userPayload: ApiPayload = {
      senderType: "user",
      phone: phone,
      name: name,
      content: "",
      file: {
        // Sin contenido de texto (o podrías poner "Imagen adjunta")
        data: audioBuffer.data, // El ArrayBuffer
        mimeType: audioBuffer.mimeType, // El tipo de audio real
        filename: `${phone}.${videoId}.mp4`, // Un nombre de archivo genérico
      },
    };

    // ¡Aquí pasamos el archivo a saveMessage!
    await saveMessage(userPayload);
    // 4. Lógica condicional (Pausa)
    if (data.human_override) {
      console.log(`IA pausada para ${phone}. No se responde a la imagen.`);
      return;
    }

    console.log("TAREA PENDIENTE: Descargar y procesar video.");
  } catch (error) {
    console.error(`Error al procesar el video ${videoId}:`, error);
  }
}
