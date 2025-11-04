import { config } from "../config.js";
import { type LocalApiPayload } from "../message/message.types.js";

const BASE_URL = config.localApiEndpoint;

/**
 * (NUEVA FUNCIÓN 1)
 * Obtiene el estado de la conversación para saber si la IA está pausada.
 * Llama a: GET /api/v1/conversations/:phone
 * @param phone El número de teléfono.
 * @returns `true` si un humano está en control (IA pausada), `false` si la IA está activa.
 */
export async function getConversationStatus(phone: string): Promise<boolean> {
  if (!BASE_URL) {
    console.error("Error: LOCAL_API_ENDPOINT no está definido");
    return false; // Falla segura: asume que la IA está activa
  }

  const url = `${BASE_URL}/conversations/${phone}`;
  console.log(`Verificando estado de IA en: ${url}`);

  try {
    const response = await fetch(url, { method: "GET" });

    if (!response.ok) {
      if (response.status === 404) {
        // 404 significa que es una conversación nueva. La IA debe estar activa.
        console.log(
          `Conversación nueva para ${phone}. IA activada por defecto.`
        );
        return false; // human_override es false
      }
      // Otro error
      console.error(
        `Error ${response.status} al obtener estado de IA. Asumiendo IA activa.`
      );
      return false; // Falla segura
    }

    const result = (await response.json()) as {
      data: { human_override: boolean };
    };

    // Devolvemos el valor del interruptor
    return result.data.human_override;
  } catch (error) {
    console.error("Excepción al conectar con API (getStatus):", error);
    return false; // Falla segura: asume IA activa
  }
}

/**
 * (NUEVA FUNCIÓN 2)
 * Simplemente guarda un mensaje en la base de datos.
 * @param payload El mensaje a guardar (de usuario, IA o humano).
 */
export async function saveMessage(payload: LocalApiPayload): Promise<void> {
  if (!BASE_URL) {
    console.error("Error: LOCAL_API_ENDPOINT no está definido");
    return;
  }

  const url = `${BASE_URL}/messages`;
  console.log(`Guardando mensaje en: ${url}`);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Error al guardar mensaje en API local:", errorData);
    } else {
      console.log(`Mensaje de ${payload.senderType} guardado exitosamente.`);
    }
  } catch (error) {
    console.error("Excepción al conectar con API (saveMessage):", error);
  }
}
