/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 💳 KARKAUL.GS v2.0 — Дата → Проект → Сумма_НДФЛ → Telegram!
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * 📊 Лист "Каркаул": A2:E[lastRow]
 * | A | B | C | D | E |
 * | Дата | Сумма | Сумма_НДФЛ | Проект | Комментарий |
 * 
 * 📱 Формат: дата-проект-сумма_НДФЛ-комментарий
 * 🗂️ Сортировка: Дата↑ → Проект → Тип
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const Karkaul = {
  check(daysAhead = 0) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Каркаул');
    
    if (!sheet) {
      console.error('❌ Лист "Каркаул" не найден!');
      return [];
    }
    
    const config = getConfig();
    const today = Utils.getTodayStart();
    
    // 🔥 A2:E[lastRow]
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) {
      console.log('ℹ️ Нет данных в Каркаул (строки 2+)');
      return [];
    }
    
    const data = sheet.getRange(2, 1, lastRow - 1, 5).getValues();
    const payments = [];
    
    // 1. Сбор платежей
    for (let i = 0; i < data.length; i++) {
      const date = data[i][0];           // A — Дата
      const amountStr = data[i][1];      // B — Сумма (fallback)
      const ndflStr = data[i][2];        // C — Сумма_НДФЛ (ПРИОРИТЕТ!)
      const project = data[i][3] || '';  // D — Проект
      const tag = data[i][4] || 'Без тэга'; // E — Комментарий
      
      // 🔥 Парсинг B (fallback)
      let amount = 0;
      if (typeof amountStr === 'string') {
        amount = parseFloat(amountStr.toString().replace(/[\s,]/g, '.').replace(',', '.'));
      } else {
        amount = parseFloat(amountStr) || 0;
      }
      
      // 🔥 Парсинг C (ПРИОРИТЕТ!)
      let ndflAmount = 0;
      if (typeof ndflStr === 'string') {
        ndflAmount = parseFloat(ndflStr.toString().replace(/[\s,]/g, '.').replace(',', '.'));
      } else if (ndflStr !== null && ndflStr !== undefined) {
        ndflAmount = parseFloat(ndflStr) || 0;
      }
      
      // ✅ Если ДАТА + (B>0 ИЛИ C>0)
      if (date instanceof Date && (amount > 0 || ndflAmount > 0)) {
        const paymentDate = new Date(date);
        paymentDate.setHours(0, 0, 0, 0);
        const diffDays = Utils.daysDiff(paymentDate, today);
        
        if (diffDays >= 0 && diffDays <= daysAhead) {
          const dateStr = Utils.formatDate(paymentDate);
          payments.push({
            date: dateStr,
            project: project,
            tag: tag,
            amount: amount,        // B
            ndflAmount: ndflAmount, // C (приоритет!)
            diffDays: diffDays,
            row: i + 2
          });
        }
      }
    }
    
    // 2. Telegram
    if (payments.length > 0) {
      Utils.sortPayments(payments);
      
      let messageLines = [];
      payments.forEach(p => {
        const duplicateKey = `payments_${daysAhead}_${p.date}_${p.project}`;
        
        if (!Logger.isDuplicateToday(duplicateKey, p.tag)) {
          // 🔥 C > 0 ? C : B
          const displayAmount = p.ndflAmount > 0 ? p.ndflAmount : p.amount;
          
          messageLines.push(`${p.date}-${p.project}-${displayAmount} руб-${p.tag}`);
          Logger.logMessage(duplicateKey, p.tag, p.date, `${p.project} ${displayAmount} руб ${p.tag}`);
        }
      });
      
      if (messageLines.length > 0) {
        const periodText = daysAhead === 0 ? 'СЕГОДНЯ' : `${daysAhead} дней`;
        const message = `🏗️ КАРКАУЛ (${periodText}):\n${messageLines.join('\n')}`;
        Telegram.send(message);
        console.log(`✅ Отправлено ${messageLines.length} строк`);
      }
    } else {
      console.log('ℹ️ Нет новых платежей за период');
    }
    
    console.log(`✅ Обработано ${payments.length} платежей`);
    return payments; // 🔥 Возврат для совместимости
  }
};
