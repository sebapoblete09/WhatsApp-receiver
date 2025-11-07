import { config } from "../config.js";
import supabasePkg from "@supabase/supabase-js";
const { createClient } = supabasePkg;
import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";

// Variable para inicializar el cliente (lo hacemos 'let' para manejar el error)
let genAI: GoogleGenerativeAI;
let supabase: supabasePkg.SupabaseClient;

// Modelos (los separamos para claridad)
let embeddingModel: any;
let chatModel: any;

// Validamos que las claves existan antes de inicializar
if (config.geminiApiKey && config.supabaseUrl && config.supabaseServiceKey) {
  genAI = new GoogleGenerativeAI(config.geminiApiKey);
  supabase = createClient(config.supabaseUrl, config.supabaseServiceKey);

  // (NUEVO) Modelo de Embedding de Google (768 dimensiones)
  embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });

  // Modelo de Chat de Google
  chatModel = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: { maxOutputTokens: 500 },
    safetySettings: [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
    ], // Limita la respuesta
  });
} else {
  console.error("FATAL: Faltan claves de IA (Gemini o Supabase) en .env");
}

/**
 * Genera una respuesta usando RAG (Google Embeddings + Supabase + Google Chat)
 * @param prompt El mensaje del usuario.
 * @returns Una respuesta generada por la IA.
 */

export async function generateFreeResponse(prompt: string): Promise<string> {
  // Verificación seguridad
  if (!embeddingModel || !chatModel || !supabase) {
    console.error("Error: Clientes de IA no inicializados.");
    return "Lo siento, mi sistema de IA no está disponible en este momento. 🤖";
  }

  try {
    // --- PASO 1: EMBEDDING DE LA PREGUNTA (Google) ---
    console.log("[Google RAG] Vectorizando pregunta...");
    const embeddingResult = await embeddingModel.embedContent(prompt);
    const questionVector = embeddingResult.embedding.values;

    // --- PASO 2: BÚSQUEDA EN VECTORES (Supabase) ---
    // (Llamamos a la función 'match_google_documents' que creaste en SQL)
    console.log("[Google RAG] Buscando en Supabase...");
    const { data: chunks, error: rpcError } = await supabase.rpc(
      "match_google_documents",
      {
        query_embedding: questionVector, // El vector de la pregunta
        match_threshold: 0.2, // Nivel de similitud (puedes ajustarlo)
        match_count: 2, // Traer los 3 mejores trozos
      }
    );

    if (rpcError) {
      console.error("Error en RPC de Supabase:", rpcError);
      throw rpcError; // Lanza el error para que el catch lo tome
    }

    // --- PASO 3: CONSTRUIR EL PROMPT (Contexto + Pregunta) ---
    let systemPrompt: string;

    if (!chunks || chunks.length === 0) {
      // --- FALLBACK: NO SE ENCONTRÓ CONTEXTO ---
      console.warn(
        "[Google RAG] No se encontró contexto en Supabase. Usando chat genérico."
      );
      // Creamos un prompt genérico si no encontramos nada
      systemPrompt = `Eres un asistente virtual amigable. Responde la pregunta del usuario.
      Pregunta: ${prompt}`;
    } else {
      // --- ÉXITO: SE ENCONTRÓ CONTEXTO ---
      const context = chunks
        .map((c: any) => c.content) // 'content' es la columna que creamos
        .join("\n---\n");

      // Este es el "prompt" de RAG que le da instrucciones a la IA
      systemPrompt = `Eres un asistente experto de la empresa "Impekble".
Tu misión es responder la pregunta del usuario basándote ÚNICAMENTE en el siguiente contexto.
Si la respuesta no está en el contexto, di amablemente: "No tengo esa información, pero un agente te atenderá".
Ademas responde de forma amigable, usando emojis, y una estrucutra ordenada, lo mas parecido a una persona real, respuestas cortas y precisas

Contexto:
${context}

Pregunta del Usuario:
${prompt}`;
    }

    // --- PASO 4: GENERAR RESPUESTA (Google Chat) ---
    console.log(`[Google RAG] Enviando a Gemini Pro...`);

    const result = await chatModel.generateContent(systemPrompt);
    const botResponse = result.response.text();

    console.log(`[Google RAG] Respuesta: "${botResponse}"`);
    return botResponse;
  } catch (error) {
    console.error("Error al generar respuesta de Gemini:", error);
    return "Tuve un problema al procesar tu solicitud. Intenta de nuevo. ⚙️";
  }
}

/**
 * Genera una respuesta de IA basada en un prompt de texto Y una imagen.
 * @param {string} prompt - El texto que acompaña a la imagen (ej: "¿Qué es esto?")
 * @param {string} imageBase64 - La imagen codificada como string en base64
 * @param {string} mimeType - El tipo MIME de la imagen (ej: "image/jpeg")
 * @returns {Promise<string>} - La respuesta de texto de la IA
 */

export async function generateImageResponse(
  prompt: string,
  imageBase64: string,
  mimeType: string
) {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
    });

    // 1. Preparamos el "payload" de la imagen
    const imagePart = {
      inlineData: {
        data: imageBase64,
        mimeType: mimeType,
      },
    };

    // 2. Enviamos el 'prompt' (texto) y la 'imagePart' (imagen) juntos
    // El orden es importante: primero el texto, luego la imagen.
    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;

    return response.text();
  } catch (error) {
    console.error("Error al generar respuesta con imagen:", error);
    return "Lo siento, no pude procesar esa imagen en este momento.";
  }
}
