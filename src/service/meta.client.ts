import { config } from "../config.js";

export async function sendWhatsAppMessage(to: string, text: string) {
  // 1. Validamos los configs necesarios
  if (!config.metaPhoneNumberId || !config.metaAccessToken) {
    console.error(
      "Error: PHONE_NUMBER_ID o ACCESS_TOKEN no están definidos en .env"
    );
    return;
  }

  // 2. Construimos la URL
  const url = `https://graph.facebook.com/v19.0/${config.metaPhoneNumberId}/messages`;

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${config.metaAccessToken}`,
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
        "Error al enviar mensaje a Meta:",
        JSON.stringify(errorData, null, 2)
      );
    } else {
      console.log(`¡Respuesta enviada a ${to}!`);
    }
  } catch (error) {
    console.error("Excepción al enviar mensaje a Meta:", error);
  }
}

// --- --- --- --- --- --- --- --- --- --- ---
// 2. NUEVAS FUNCIONES (Para descargar media)
// =======================================

/**
 * PASO 1: Obtiene la URL de descarga temporal de un archivo (imagen, audio, etc.)
 * @param mediaId El ID del archivo (ej. message.image.id)
 * @returns La URL temporal para descargar el archivo.
 */

export async function getMediaDownloadUrl(mediaId: string): Promise<string> {
  const url = `https://graph.facebook.com/v19.0/${mediaId}`;

  try {
    // Asegurarse de que el token esté disponible
    if (!config.metaAccessToken) {
      throw new Error("Error: ACCESS_TOKEN no está definido en .env");
    }

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${config.metaAccessToken}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error al obtener URL: ${response.status} ${errorText}`);
    }

    const data = (await response.json()) as { url: string };
    return data.url;
  } catch (error) {
    console.error("Error en getMediaDownloadUrl:", error);
    throw error;
  }
}

/**
 * PASO 2: Descarga el archivo binario (la imagen) desde la URL temporal.
 * @param mediaUrl La URL temporal obtenida del Paso 1.
 * @returns Un Buffer con los datos de la imagen.
 */
export async function downloadMedia(mediaUrl: string): Promise<Buffer> {
  try {
    // Asegurarse de que el token esté disponible
    if (!config.metaAccessToken) {
      throw new Error("Error: ACCESS_TOKEN no está definido en .env");
    }

    const response: Response = await fetch(mediaUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${config.metaAccessToken}`, // También requiere token
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Error al descargar archivo: ${response.status} ${errorText}`
      );
    }

    // response.buffer() convierte la respuesta en un Buffer binario
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.error("Error en downloadMedia:", error);
    throw error;
  }
}
