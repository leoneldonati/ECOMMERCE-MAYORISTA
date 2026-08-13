import { sendTelegram } from "../app/lib/notify.server";

// Manda un mensaje de prueba al chat configurado (npm run notify:test) para
// confirmar que el bot y el chat_id están bien. Sin config, falla con un aviso.

if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_CHAT_ID) {
  console.error("Falta TELEGRAM_BOT_TOKEN y/o TELEGRAM_CHAT_ID. Configuralos en .env.");
  process.exit(1);
}

await sendTelegram("✅ Prueba de notificaciones de Despensa Online.");
console.log("Mensaje enviado. Revisá tu Telegram.");
