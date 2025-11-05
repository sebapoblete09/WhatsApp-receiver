import {
  downloadMedia,
  getMediaDownloadUrl,
  sendWhatsAppMessage,
} from "../service/meta.client.js";
import {
  getConversationStatus,
  saveMessage,
} from "../service/localApi.client.js";
import { type ApiPayload } from "./message.types.js";
import { generateFreeResponse } from "../service/gemini.client.js";
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
    const isHumanOverride = await getConversationStatus(phone);

    // 2. Guardamos el mensaje del usuario SIEMPRE
    const userPayload: ApiPayload = {
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
  name: string
) {
  console.log(`[PRUEBA LOCAL] Procesando imagen ${imageId} de ${name}...`);

  try {
    // 1. Descargar la imagen de Meta
    const downloadUrl = await getMediaDownloadUrl(imageId);
    const imageBuffer = await downloadMedia(downloadUrl);
    console.log(`[PRUEBA LOCAL] Imagen descargada.`);

    // 2. Guardar la imagen en el disco
    const fileName = "imagen_recibida.jpg";
    // path.join(process.cwd()) la guarda en la carpeta raíz de tu proyecto
    const savePath = path.join(process.cwd(), fileName);

    fs.writeFileSync(savePath, imageBuffer); // ¡Aquí se guarda el archivo!

    console.log(`[PRUEBA LOCAL] Imagen guardada en: ${savePath}`);

    // 3. Avisar al usuario por WhatsApp
    await sendWhatsAppMessage(
      phone,
      `[PRUEBA] ¡Recibí tu imagen! La guardé en mi servidor local como '${fileName}'.`
    );
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
  console.log(`[TAREA PENDIENTE] Procesando audio ${audioId} de ${name}...`);
  try {
    //ACA VA LA LOGICA PARA DESCARGAR EL AUDIO Y MANDARSELO A SUPABASE, HAY QUE VER SI MANDARSELO COMO AUDIO O TEXTO
    console.log("TAREA PENDIENTE: Descargar y procesar audio.");
  } catch (error) {
    console.error(`Error al procesar el audio ${audioId}:`, error);
  }
}
