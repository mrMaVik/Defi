/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 🚀 DeFi Monitor v2.4.16 + 📱 TELEGRAM v2.0 (10 файлов ✅) — КОПИРУЙ В ЧАТ!
 * ═══════════════════════════════════════════════════════════════════════════════

📁 СТРУКТУРА + ВЗАИМОДЕЙСТВИЯ (Clasp Apps Script):

Code.js (ГЛАВНЫЙ)
├── testAaveOnly() → aave.js → config.AAVE_WALLET (B9)
├── testTelegram() → telegram.js → B2:B3 (@BotFather)
├── checkTelegram() → karkaul.js → logger.js → utils.sort()
└── utils.createTrigger('testAaveOnly', 15) — 15мин DeFi

📋 ЛИСТЫ "Настройки" B2:B13:
B2: TELEGRAM_TOKEN    B3: CHAT_ID    B4: Дней    B5: Час MSK
B9: AAVE_WALLET       B10: MIN_COLLAT B11: MAX_LTV

═══ КОПИРУЙ ЭТО В НОВЫЙ ЧАТ ════════════════════════════════════════════════════
🚀 DeFi+Telegram v2.4.16 (mrMaVik/Defi)

📁 10 файлов:
• Code.js — testAaveOnly() + testTelegram() + меню 🔥 МОЙ БОТ
• config.js — getConfig() → B2:B13  
• aave.js — Aave DeFi (config.AAVE_WALLET безопасно!)
• telegram.js — sendTelegram() → B2:B3
• karkaul.js — Karkaul.check() → Каркаул!A2:E
• logger.js — logData() → Логи + анти-дубли 24ч
• svodka.js — Svodka.update() → Сводка!B7↓
• utils.js — createTrigger(15мин) + sortPayments()
• README.js — документация v2.0
• gmx.js — GMX (опционально)

✅ Работает:
• testAaveOnly() → зелёный Aave дашборд + алерты
• checkTelegram() → Каркаул→Сводка→Telegram (4сек ⚡)
• config.getConfig() → B2:B13 (ленивый кэш)
• utils.createTrigger() → 15мин авто

❌ Repo private: история aave.js содержит wallet
═══ КОНЕЦ ШАБЛОНА ════════════════════════════════════════════════════════════

🔧 НАСТРОЙКА (5 мин):
1. Копируй ШАБЛОН выше → новый чат → контекст готов!
2. "Настройки" B2:B13 ← Bot Token, Wallet, Chat ID...
3. F5 → 🔥 МОЙ БОТ → 🧪 Тест Telegram/Aave
4. 🔥 МОЙ БОТ → ⏰ Триггер → авто 15мин/ежедневно!

📱 TELEGRAM ФОРМАТ:
🏗️ КАРКАУЛ (сегодня): 01.02-test-01-2058руб-Проценты
📊 СВОДКА (февраль): B6 жирный + B7↓ платежи

✅ v2.0 ФИКСЫ: анти-дубли, Europe/Moscow, Сумма-НДФЛ=C, API 400/401 check
👤 mrMaVik — DeFi+Finance Automation
*/
