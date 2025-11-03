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
