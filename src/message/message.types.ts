export type SenderType = "user" | "ai";

// Payload que espera la API
export interface LocalApiPayload {
  senderType: SenderType;
  phone: string;
  name: string;
  content: string;
}

// Tipado básico del Webhook de Meta
export interface WhatsAppWebhookBody {
  object: string;
  entry: Array<{
    changes: Array<{
      value: {
        messages: Array<{
          from: string;
          text: { body: string };
        }>;
        contacts: Array<{
          profile: { name: string };
        }>;
      };
    }>;
  }>;
}
