/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 🎯 CODE.GS — МЕНЮ + ГЛАВНЫЕ ФУНКЦИИ TELEGRAM (v2.3) + AAVE 15min ✅
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * 📋 Функции:
 * • onOpen() — 🔧 МОЙ БОТ (меню + авто Сводка)
 * • testTelegram() — 🧪 ТЕСТ (Karkaul + Aave + Telegram)
 * • checkTelegram() — 🔄 ОСНОВНАЯ (09:00 Karkaul + Aave)
 * • checkAaveOnly() — ⏰ AAVE 15min (мониторинг HF)
 * ═══════════════════════════════════════════════════════════════════════════════
 */

function testTelegram() {
  try {
    console.log('🧪 === ТЕСТ TELEGRAM (ЛОГИ ОЧИЩЕНЫ) ===');
    
    Logger.CLEAR_logs();
    console.log('✅ Логи очищены!');
    
    const config = getConfig();
    if (!config) {
      console.log('❌ Config недоступен');
      return;
    }
    
    console.log('✅ Config OK!');
    
    // 🔥 KARKAUL
    console.log('🏗️ 1/3 Karkaul...');
    const payments = Karkaul.check(config.DAYS_AHEAD);
    
    // 🔥 AAVE
    console.log('🪙 2/3 Aave...');
    const positions = Aave.check();
    
    // 🔥 СВОДКА
    console.log('📊 3/3 Сводка...');
    if (typeof Svodka !== 'undefined') Svodka.update();
    
    console.log('✅ Тест завершён! Проверь Telegram!');
    
    // 🔥 АВТО-СОЗДАНИЕ ТРИГГЕРОВ после успеха!
    if (payments.length > 0 || positions.length > 0) {
      console.log('🎯 Создаём триггеры...');
      createDailyTrigger();
      createAaveTrigger15min();
      console.log('✅ Триггеры: 09:00 + 15min установлены!');
      
      SpreadsheetApp.getUi().alert(
        `✅ ТЕЛЕГРАМ ОТПРАВЛЕН!\n${payments.length} платежей + ${positions.length} Aave\n\n` +
        `⏰ ТРИГГЕРЫ:\n• checkTelegram: ${config.TRIGGER_HOUR}:00 MSK\n• Aave 15min: 24/7`
      );
    }
    
    Logger.CLEAR_logs();
    console.log('🧹 Логи очищены!');
    
  } catch(e) {
    console.error('❌ testTelegram:', e.toString());
    SpreadsheetApp.getUi().alert('❌ testTelegram: ' + e.toString());
    Logger.CLEAR_logs();
  }
}

function checkTelegram() {
  try {
    const now = Utils.formatDate(new Date());
    console.log(`🔄 === CHECK TELEGRAM ${now} ===`);
    
    const config = getConfig();
    if (!config) return;
    
    Karkaul.check(config.DAYS_AHEAD);
    Aave.check();
    if (typeof Svodka !== 'undefined') Svodka.update();
    
    console.log('✅ checkTelegram завершён!');
  } catch(e) {
    console.error('❌ checkTelegram:', e);
  }
}

function createDailyTrigger() {
  Utils.createTrigger('checkTelegram');
  console.log('✅ Триггер checkTelegram 09:00 установлен!');
}

function createAaveTrigger15min() {
  // Удаляем старые Aave триггеры
  ScriptApp.getProjectTriggers().forEach(trigger => {
    if (trigger.getHandlerFunction() === 'checkAaveOnly') {
      ScriptApp.deleteTrigger(trigger);
    }
  });
  
  // 🔥 НОВЫЙ: каждые 15 минут 24/7
  ScriptApp.newTrigger('checkAaveOnly')
    .timeBased()
    .everyMinutes(15)
    .create();
  console.log('✅ Aave триггер 15min СОЗДАН!');
}

function checkAaveOnly() {
  try {
    console.log('🔄 Aave 15min check...');
    Aave.check();
  } catch(e) {
    console.error('❌ checkAaveOnly:', e);
  }
}

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🔥 МОЙ БОТ')
    .addItem('🧪 Тест Телеграмм', 'testTelegram')
    .addSeparator()
    .addItem('🏗️ Только Karkaul', 'testKarkaulOnly')
    .addItem('🪙 Обновить Aave', 'testAaveOnly')  // ✅ Убрали дубли
    .addSeparator()
    .addItem('📊 Обновить Сводку', 'testSvodka')
    .addItem('⏰ Триггер 09:00 (Karkaul)', 'createDailyTrigger')
    .addItem('⏰ Aave 15min (24/7)', 'createAaveTrigger15min')
    .addItem('🔄 Пересоздать все триггеры', 'recreateAllTriggers')
    .addSeparator()
    .addItem('🧹 Очистить логи', 'clearLogs')
    .addToUi();
  
  if (typeof Svodka !== 'undefined') Svodka.update();
  console.log('✅ Меню + Svodka готовы! Aave → 15min триггер');
}


function testKarkaulOnly() {
  const payments = Karkaul.check(getConfig().DAYS_AHEAD);
  console.log(`✅ Karkaul: ${payments.length} платежей`);
}

function testAaveOnly() {
  const positions = Aave.check();
  console.log(`✅ Aave: ${positions.length} позиций`);
}

function testSvodka() {
  if (typeof Svodka !== 'undefined') {
    Svodka.update();
    console.log('✅ Сводка обновлена!');
  }
}

/** 🔄 ПЕРЕСОЗДАТЬ ВСЕ триггеры */
function recreateAllTriggers() {
  createDailyTrigger();
  createAaveTrigger15min();
  console.log('✅ ВСЕ триггеры пересозданы!');
  SpreadsheetApp.getUi().alert('✅ Триггеры:\n• 09:00 Karkaul+Aave\n• Aave каждые 15 мин');
}

function clearLogs() {
  try {
    console.log('🧹 === ОЧИСТКА ЛОГОВ ===');
    if (typeof Logger !== 'undefined') Logger.CLEAR_logs();
    console.log('✅ Логи ОЧИЩЕНЫ!');
  } catch(e) {
    console.error('❌ clearLogs:', e);
  }
}
