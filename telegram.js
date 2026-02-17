/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 📱 TELEGRAM.GS v2.0 — Отправка сообщений (HTML + ПРОВЕРКА!)
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * 🎯 Telegram.send("текст") → Авто-проверка Token/Chat ID
 * 🔒 B2=Token, B3=Chat ID → ЛОГИ + СТАТУС ответа
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const Telegram = {
  send(text) {
    try {
      const config = getConfig();
      
      // 🔥 ПРОВЕРКА ПЕРЕД отправкой
      if (!config.BOT_TOKEN || config.BOT_TOKEN.length < 30) {
        console.error('❌ Telegram: B2 Token пустой/неверный!');
        return;
      }
      if (!config.CHAT_ID || config.CHAT_ID.length < 8) {
        console.error('❌ Telegram: B3 Chat ID пустой/неверный!');
        return;
      }
      
      const url = `https://api.telegram.org/bot${config.BOT_TOKEN}/sendMessage`;
      const payload = { 
        chat_id: config.CHAT_ID,  // ✅ config, НЕ CONFIG!
        text: text, 
        parse_mode: 'HTML' 
      };
      
      const params = {
        method: 'post',
        contentType: 'application/json',
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
      };
      
      const response = UrlFetchApp.fetch(url, params);
      const responseData = JSON.parse(response.getContentText());
      
      // 🔥 ПРОВЕРКА ОТВЕТА Telegram API!
      if (responseData.ok) {
        console.log('✅ Telegram OK:', text.substring(0, 50) + '...');
      } else {
        console.error('❌ Telegram API:', responseData.description);
        console.error('Ответ:', JSON.stringify(responseData));
      }
      
    } catch(e) {
      console.error('❌ Telegram ERROR:', e.toString());
      console.log('🔧 Проверь: Настройки!B2 (Token), B3 (Chat ID)');
    }
  }
};
