/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 🗂️ LOGGER.GS v2.0 — Логи A2! + Антидубли (H2:H3 OK!)
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * 📊 Лист "Логи": A1=заголовки | A2↓=данные (5 колонок A-E)
 * 🎯 getFirstEmptyRow() — ИГНОРИРУЕТ H2:H3 текст!
 * 🎯 isDuplicateToday() — БЛОКИРОВКА дублей за сегодня
 * 
 * ✅ ТЕСТ: H2="test", H3="test" → ЛОГИ С A2!
 * ═══════════════════════════════════════════════════════════════════════════════
 */


const Logger = {
  getLogSheet() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName('Логи');
    
    if (!sheet) {
      sheet = ss.insertSheet('Логи');
      sheet.getRange('A1:E1').setValues([['Дата/Время','Тэг','Тип','Дата платежа','Сообщение']]);
      sheet.getRange('A1:E1').setFontWeight('bold');
    }
    return sheet;
  },

  // 🔥 ФИКС: реальная первая пустая строка A-E!
  getFirstEmptyRow() {
    const sheet = this.getLogSheet();
    const lastRow = sheet.getLastRow();
    
    if (lastRow < 2) return 2; // A2
    
    // Проверяем ТОЛЬКО A-E (5 колонок!)
    const data = sheet.getRange(2, 1, lastRow - 1, 5).getValues();
    
    for (let i = 0; i < data.length; i++) {
      if (!data[i][0]) { // ПУСТОЙ A!
        return i + 2;
      }
    }
    return lastRow + 1;
  },

  logMessage(tagRow, type, paymentDateStr, text) {
    const sheet = this.getLogSheet();
    const now = new Date();
    const row = this.getFirstEmptyRow(); // 🔥 A2!
    
    sheet.getRange(row, 1, 1, 5).setValues([[now, tagRow, type, paymentDateStr, text]]);
    console.log(`📝 Лог A${row}: ${tagRow} ${type}`);
  },

  CLEAR_logs() {
    const sheet = this.getLogSheet();
    sheet.getRange('A2:E').clearContent(); // 🔥 ВСЁ с A2!
    console.log('✅ Логи ОЧИЩЕНЫ! (A2:E)');
  },

  isDuplicateToday(tagRow, type) {
    const sheet = this.getLogSheet();
    if (sheet.getLastRow() < 2) return false;
    
    const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 5).getValues();
    const todayStr = Utils.formatDate(new Date());
    
    for (let i = 0; i < data.length; i++) {
      const logDateStr = Utils.formatDate(data[i][0]);
      if (data[i][1] === tagRow && 
          data[i][2] === type && 
          logDateStr === todayStr) {
        console.log(`⏭️ ДУБЛЬ: ${tagRow} ${type}`);
        return true;
      }
    }
    return false;
  }
};

