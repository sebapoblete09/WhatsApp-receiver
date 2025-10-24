// src/index.ts
import express, { type Request, type Response } from "express";

const app = express();
// Middleware para que Express entienda JSON
app.use(express.json());

const PORT = process.env.PORT || 8000;

// --- 1. VERIFICACIÓN DEL WEBHOOK (GET) ---
app.get("/api/whatsapp", (req: Request, res: Response) => {
  // Este es el token secreto que inventarás y pondrás en Meta
  const VERIFY_TOKEN = process.env.META_VERIFY_TOKEN || "qwerasd13";

  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("WEBHOOK_VERIFIED");
    res.status(200).send(challenge);
  } else {
    console.error("Failed webhook verification");
    res.status(403).send("Forbidden");
  }
});

// --- 2. RECEPCIÓN DE MENSAJES (POST) ---
app.post("/api/whatsapp", (req: Request, res: Response) => {
  const body = req.body;

  console.log(JSON.stringify(body, null, 2)); // Log del mensaje completo

  try {
    if (body.object === "whatsapp_business_account") {
      const message = body.entry[0].changes[0].value.messages[0];
      const from = message.from;
      const msg_body = message.text.body;

      console.log(`Mensaje de ${from}: ${msg_body}`);

      // --- AQUÍ VA TU LÓGICA FUTURA ---
      // 1. Guardar 'msg_body' en Supabase (await supabase.insert(...))
      // 2. Llamar al Servicio B (RAG) (await fetch(...))
      // 3. Guardar respuesta_bot en Supabase
      // 4. Enviar respuesta_bot a Meta
      // ------------------------------------
    }

    // Responde 200 OK a Meta INMEDIATAMENTE
    res.status(200).send("EVENT_RECEIVED");
  } catch (error) {
    console.error("Error procesando el mensaje:", error);
    res.status(200).send("EVENT_RECEIVED_WITH_ERROR");
  }
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});
