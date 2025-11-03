import { config } from "../config.js";
import { type LocalApiPayload } from "../message/message.types.js";

export async function saveMessageToApi(payload: LocalApiPayload) {
  // --- ¡CAMBIOS AQUÍ! ---
  // 1. Movemos la URL aquí
  const url = config.localApiEndpoint;

  // 2. Añadimos la validación
  if (!url) {
    console.error(
      "Error: LOCAL_API_ENDPOINT no está definido en el archivo .env"
    );
    return; // Salir de la función si la URL no existe
  }
  // --- FIN DE CAMBIOS ---

  console.log("Enviando a Api:", JSON.stringify(payload, null, 2));

  try {
    // Ahora TypeScript sabe que 'url' es un 'string'
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // 'Authorization': 'Bearer TU_API_KEY_LOCAL'
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error(
        "Error al guardar mensaje en Api local:",
        JSON.stringify(errorData, null, 2)
      );
    } else {
      const data = await response.json();
      console.log("¡Mensaje guardado en API local exitosamente!", data);
    }
  } catch (error) {
    console.error("Excepción al conectar con API local:", error);
  }
}
