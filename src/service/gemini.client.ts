import { GoogleGenerativeAI } from "@google/generative-ai";
import { config } from "../config.js";

// Variable para inicializar el cliente (lo hacemos 'let' para manejar el error)
let genAI: GoogleGenerativeAI;

if (config.geminiApiKey) {
  genAI = new GoogleGenerativeAI(config.geminiApiKey);
} else {
  console.error("GEMINI_API_KEY no se cargó. El cliente de IA no funcionará.");
}

/**
 * Genera una respuesta libre usando el modelo Gemini.
 * @param prompt El mensaje del usuario.
 * @returns Una respuesta generada por la IA.
 */
export async function generateFreeResponse(prompt: string): Promise<string> {
  // Verificación por si falló la inicialización
  if (!genAI) {
    console.error("Error: El cliente de IA (Gemini) no está inicializado.");
    return "Lo siento, el sistema de IA no está disponible en este momento. 🤖";
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // (Opcional) Un prompt de sistema simple para darle contexto
    const systemPrompt =
      "Eres un asistente virtual amigable. Responde de forma concisa. y profesional";

    const chat = model.startChat({
      history: [
        { role: "user", parts: [{ text: systemPrompt }] },
        {
          role: "model",
          parts: [
            { text: "¡Entendido! Seré un asistente amigable y conciso." },
          ],
        },
      ],
      generationConfig: {
        maxOutputTokens: 250, // Limita la longitud de la respuesta
      },
    });

    const result = await chat.sendMessage(prompt);
    // const result = await model.generateContent(prompt); // <-- Alternativa más simple

    const response = result.response;
    const text = response.text();

    console.log("Respuesta de Gemini:", text);
    return text;
  } catch (error) {
    console.error("Error al generar respuesta de Gemini:", error);
    return "Tuve un problema al procesar tu solicitud. Intenta de nuevo. ⚙️";
  }
}
