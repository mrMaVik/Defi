/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 📋 CONFIG.GS v2.2 — ЛЕНИВЫЙ + AAVE! B2-B13 (Настройки)
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * ✅ МОЙ БОТ = ui.alert() если B2/B3 пустые!
 * ✅ Apps Script = console.error() (без popup)
 * ✅ Кэш config — НЕ загружает лишний раз
 * ✅ AAVE: B9=WALLET, B10-B13=HF параметры
 * ═══════════════════════════════════════════════════════════════════════════════
 */

function getConfigFromSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const settingsSheet = ss.getSheetByName('Настройки');
  
  if (!settingsSheet) {
    const ui = SpreadsheetApp.getUi();
    ui.alert('❌ Лист "Настройки" не найден!\nСоздай B2-B13 для Telegram+AAVE.');
    console.error('❌ Лист "Настройки" не найден!');
    return null;
  }
  
  const config = {
    // 📱 TELEGRAM (B2-B3)
    BOT_TOKEN: settingsSheet.getRange('B2').getValue()?.toString().trim() || '',
    CHAT_ID: settingsSheet.getRange('B3').getValue()?.toString().trim() || '',
    
    // 🏗️ KARKAUL (B4-B6)
    DAYS_AHEAD: parseInt(settingsSheet.getRange('B4').getValue()) || 0,
    TRIGGER_HOUR: parseInt(settingsSheet.getRange('B5').getValue()) || 9,
    TAX_RATE: parseFloat(settingsSheet.getRange('B6').getValue()) || 0,
    
    // 🪙 AAVE (B9-B13) ⭐ НОВОЕ!
    AAVE_WALLET: settingsSheet.getRange('B9').getValue()?.toString().trim() || '',
    HF_ALERT: parseFloat(settingsSheet.getRange('B10').getValue()) || 30.0,
    HF_YELLOW: parseFloat(settingsSheet.getRange('B11').getValue()) || 30.0,
    HF_RED: parseFloat(settingsSheet.getRange('B12').getValue()) || 28.0,
    HF_DROP: parseFloat(settingsSheet.getRange('B13').getValue()) || 0.05,
    
    PROJECTS_SHEET_NAME: 'Каркаул'
  };
  
  // 🔥 ПРОВЕРКА TELEGRAM (B2/B3)
  if (!config.BOT_TOKEN || config.BOT_TOKEN.length < 30) {
    SpreadsheetApp.getUi().alert('❌ Настройки!B2: ВСТАВЬ TOKEN из @BotFather!\n(1234567890:AAElkjhGHI...)');
    console.error('❌ Настройки!B2: Token пустой/короткий!');
    return null;
  }
  
  if (!config.CHAT_ID || config.CHAT_ID.length < 8) {
    SpreadsheetApp.getUi().alert('❌ Настройки!B3: ВСТАВЬ CHAT ID из @userinfobot!\n(9 цифр: 284653933)');
    console.error('❌ Настройки!B3: Chat ID пустой/короткий!');
    return null;
  }
  
  // ⚠️ ПРОВЕРКА AAVE WALLET (B9) ⭐ НОВОЕ!
  if (!config.AAVE_WALLET || config.AAVE_WALLET.length < 40) {
    console.warn('⚠️ Настройки!B9: AAVE WALLET пустой!\nИспользуется дефолтный кошелёк.');
  }
  
  console.log('⚙️ Config v2.2 загружен:', {
    DAYS_AHEAD: config.DAYS_AHEAD,
    TRIGGER_HOUR: config.TRIGGER_HOUR,
    TAX_RATE: config.TAX_RATE,
    AAVE_WALLET: config.AAVE_WALLET.substring(0, 10) + '...', // Частично
    HF_ALERT: config.HF_ALERT,
    HF_DROP: config.HF_DROP
  });
  
  return config;
}

// ✅ Кэш — НЕ загружаем повторно!
let CONFIG = null;

function getConfig() {
  if (!CONFIG) {
    CONFIG = getConfigFromSheet();
  }
  return CONFIG;
}

// 🔥 ОЧИСТКА КЭША (при изменении B2-B13)
function clearConfigCache() {
  CONFIG = null;
  console.log('✅ Config v2.2 кэш очищен! (B2-B13)');
}
