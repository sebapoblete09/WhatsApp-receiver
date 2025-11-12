# WhatsApp-Receiver (Servicio de Mensajería con IA)

Este proyecto es un backend que actúa como intermediario para la API de WhatsApp Business (Meta). Gestiona la recepción de mensajes de un webhook de Meta, procesa los mensajes (texto, imágenes, videos y audios) y genera respuestas automáticas utilizando IA (Google Gemini) basada en una base de conocimiento externa.

## 🚀 Propósito del Proyecto

El objetivo principal es automatizar la atención al cliente o la respuesta a consultas comunes a través de WhatsApp. El sistema puede:
* Recibir y validar mensajes del webhook de Meta.
* Detectar el tipo de mensaje (texto, imagen, etc.).
* Para mensajes de texto, generar una respuesta inteligente usando un modelo RAG (Retrieval-Augmented Generation) con Google Gemini.
* Para las imagenes y videos, dependiendo del tipo de esta (Comprobante, Propiedades, otros), tiene diferentes caminos para responder, o avisar a un ejecutivo
* La base de conocimiento del RAG se alimenta desde Supabase, la cual es actualizada a través de un pipeline en n8n.
* Enviar respuestas de vuelta al usuario a través de la API de Meta.
* Tanto los mensajes de entrada como de salida se guardan en Supabase.

## 🛠️ Stack Tecnológico

* **Lenguaje:** TypeScript
* **Plataforma:** Node.js
* **Framework:** Express.js
* **API Principal:** WhatsApp Business API (Meta)
* **Servicio de IA:** Google Gemini
* **Base de Conocimiento (RAG):** Supabase
* **Pipeline de Datos:** n8n (Para poblar Supabase)
* **Deployment:** Render (Solo en modo desarollo, no produccion final)

## 📁 Arquitectura y Flujo de Datos

El proyecto está modularizado para separar responsabilidades, facilitando su mantenimiento.

### Estructura de Carpetas Clave

* `src/index.ts`: Punto de entrada de la aplicación. Inicializa y configura el servidor.
* `src/app.ts`: Configuración principal de la aplicación (middlewares, rutas).
* `src/config.ts`: Carga y gestiona las variables de entorno.
* **`src/message/`**: Módulo principal de lógica de negocio.
    * `message.controller.ts`: Maneja las peticiones HTTP del webhook, valida y llama al servicio.
    * `message.service.ts`: Orquesta la lógica. Decide si un mensaje debe ser respondido por IA, cómo procesar una imagen, etc.
    * `message.types.ts`: Define las interfaces y tipos de TypeScript para los mensajes.
* **`src/service/`**: Clientes externos.
    * `meta.client.ts`: Cliente para comunicarse con la API de Meta (enviar mensajes).
    * `gemini.client.ts`: Cliente para conectarse con la API de Google Gemini y generar respuestas.
    * `localApi.client.ts`: Cliente para conectarse al back que gestiona el CRUD de los mensajes, alertas, etc.

### Flujo de IA (RAG)

1.  Un documento (ej. PDF, .txt) con información relevante se carga en **n8n**. Este documento debe estar en un drive
2.  **n8n** procesa el documento y actualiza la base de conocimiento (embeddings) en **Supabase**.
3.  Un usuario envía un mensaje de texto a WhatsApp.
4.  El Webhook de Meta lo envía a `message.controller.ts`.
5.  `message.service.ts` recibe el mensaje y llama a `gemini.client.ts`.
6.  `gemini.client.ts` toma la pregunta, consulta la información relevante en **Supabase** y genera una respuesta fundamentada con Gemini.
7.  La respuesta se envía de vuelta al usuario a través de `meta.client.ts`.

## ⚙️ Instalación y Puesta en Marcha

Sigue estos pasos para ejecutar el proyecto en un entorno de desarrollo.

### Prerrequisitos

* Node.js (v18.0 o superior)
* `npm` o `yarn`
* Acceso a las API Keys de Meta, Google Gemini y Supabase.

### Pasos de Instalación

1.  **Clonar el repositorio:**
    ```bash
    git clone [URL_DEL_REPO]
    cd WhatsApp-Receiver
    ```

2.  **Instalar dependencias:**
    ```bash
    npm install
    ```

3.  **Configurar Variables de Entorno:**
    Crea un archivo `.env` en la raíz del proyecto. 
    Copia y pega la estructura de abajo en tu nuevo archivo `.env` y rellena los valores.

4.  **Ejecutar en modo desarrollo:**
    El proyecto usa `nodemon` para reiniciarse automáticamente con los cambios.
    ```bash
    npm run dev
    ```


## 🔐 Variables de Entorno

Este proyecto no funcionará sin las siguientes variables. Asegúrate de crear tu archivo `.env` y completarlo.

```ini
# .env
# Puerto del servidor
PORT=8080

# Credenciales de Meta (WhatsApp Business API)
META_VERIFY_TOKEN= [El token de verificación de tu webhook]
ACCESS_TOKEN= [El token de acceso permanente de tu App de Meta]
PHONE_NUMBER_ID= [El ID del número de teléfono]

# Credenciales de Google Gemini
GEMINI_API_KEY= [ Tu API Key de Google AI Studio]

# Credenciales de Supabase (para el RAG)
SUPABASE_URL= [La URL de tu proyecto Supabase]
SUPABASE_SERVICE_KEY= [La llave 'anon' pública de Supabase]

# Credenciales de la API Local
LOCAL_API_ENDPOINT=[Tu URL del back que contiene lo relacionado a Supabase, para los get, post, etc de los mensajes, alertas, etc]
