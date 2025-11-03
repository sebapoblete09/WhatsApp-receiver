import { config } from "../config.js";

const url = `https://graph.facebook.com/v19.0/${config.metaPhoneNumberId}/messages`;

export async function sendWhatsAppMessage(to: string, text: string) {
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
      console.log("¡Respuesta de Meta enviada exitosamente!");
    }
  } catch (error) {
    console.error("Excepción al enviar mensaje a Meta:", error);
  }
}
