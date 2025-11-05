export type SenderType = "user" | "ai" | "admin";

// Payload que espera la API
export interface ApiPayload {
  senderType: SenderType;
  phone: string;
  name: string;
  content?: string;
  file?: { data: ArrayBuffer; filename: string; mimeType: string };
}

// Tipado básico del Webhook de Meta
export interface WhatsAppWebhookBody {
  object: string;
  entry: Array<{
    changes: Array<{
      value: {
        messages?: WhatsAppMessage[];
        contacts?: Array<{
          profile: { name: string };
        }>;
      };
    }>;
  }>;
}

// Un mensaje de texto
interface TextMessage {
  from: string;
  id: string;
  timestamp: string;
  type: "text";
  text: { body: string };
}

// Un mensaje de imagen
interface ImageMessage {
  from: string;
  id: string;
  timestamp: string;
  type: "image";
  image: {
    mime_type: string;
    sha256: string;
    id: string;
  };
}

// Un mensaje de audio
interface AudioMessage {
  from: string;
  id: string;
  timestamp: string;
  type: "audio";
  audio: {
    mime_type: string;
    sha256: string;
    id: string;
  };
}

type WhatsAppMessage = TextMessage | ImageMessage | AudioMessage;
