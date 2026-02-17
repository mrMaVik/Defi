/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 📊 СВОДКА.GS v2.0 — Платежи месяца B3 (февраль → B7↓) (Каркаул)
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * 📋 Лист "Сводка":
 * B3: "февраль" (текст месяца)
 * B7↓: 31.01-test-01-2058 руб-Проценты
 * 
 * 🗂️ Фильтр: Каркаул → месяц B3 → Сортировка → B7
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const Svodka = {
  update() {
    try {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const projectsSheet = ss.getSheetByName('Каркаул');  // ✅ ИЗМЕНЕНО!
      const svodkaSheet = ss.getSheetByName('Сводка');
      
      if (!projectsSheet || !svodkaSheet) {
        console.error('❌ Листы "Каркаул" или "Сводка" не найдены!');
        return;
      }
      
      // 🔥 B3 = текст месяца
      const monthText = svodkaSheet.getRange('B3').getValue()?.toString().trim().toLowerCase() || '';
      
      if (!monthText) {
        svodkaSheet.getRange('B7').setValue('❌ B3: ВСТАВЬ месяц (февраль)');
        return;
      }
      
      // 🔥 Текст → номер месяца
      const monthMap = {
        'январь': 0, 'февраль': 1, 'март': 2, 'апрель': 3, 'май': 4, 'июнь': 5,
        'июль': 6, 'август': 7, 'сентябрь': 8, 'октябрь': 9, 'ноябрь': 10, 'декабрь': 11
      };
      
      const monthNum = monthMap[monthText];
      if (monthNum === undefined) {
        svodkaSheet.getRange('B6').setValue(`❌ B3: "${monthText}" ≠ январь..декабрь`);
        return;
      }
      
      // 🔥 Год + месяц B3
      const today = new Date();
      const monthStart = new Date(today.getFullYear(), monthNum, 1);
      const monthEnd = new Date(today.getFullYear(), monthNum + 1, 0, 23, 59, 59);
      
      console.log(`📅 Сводка "${monthText}": ${Utils.formatDate(monthStart)} - ${Utils.formatDate(monthEnd)}`);
      
      // 🔥 B6 = ЖИРНЫЙ ЗАГОЛОВОК!
      const headerText = `Платежи этого месяца`;
      svodkaSheet.getRange('B6').setValue(headerText);
      svodkaSheet.getRange('B6').setFontWeight('bold');
      svodkaSheet.getRange('B6').setFontSize(10);

      // 1. Каркаул A2:E
      const lastRow = projectsSheet.getLastRow();
      if (lastRow < 2) {
        svodkaSheet.getRange('B7').setValue('ℹ️ Нет данных в Каркаул');
        return;
      }
      
      const data = projectsSheet.getRange(2, 1, lastRow - 1, 5).getValues();
      const payments = [];
      
      // 2. Фильтр по месяцу B3 + Сумма_НДФЛ!
      for (let i = 0; i < data.length; i++) {
        const date = data[i][0];
        const amountStr = data[i][1];  // B
        const ndflStr = data[i][2];    // C — ПРИОРИТЕТ!
        const project = data[i][3] || '';
        const tag = data[i][4] || 'Без тэга';
        
        // 🔥 Сумма: C > 0 ? C : B
        let amount = 0;
        if (typeof ndflStr === 'string' && ndflStr) {
          amount = parseFloat(ndflStr.toString().replace(/[\s,]/g, '.').replace(',', '.'));
        } else if (typeof amountStr === 'string') {
          amount = parseFloat(amountStr.toString().replace(/[\s,]/g, '.').replace(',', '.'));
        } else {
          amount = parseFloat(ndflStr || amountStr) || 0;
        }
        
        if (date instanceof Date && amount > 0) {
          const paymentDate = new Date(date);
          paymentDate.setHours(0, 0, 0, 0);
          
          if (paymentDate >= monthStart && paymentDate <= monthEnd) {
            const dateStr = Utils.formatDate(paymentDate);
            payments.push({
              date: dateStr,
              project: project,
              tag: tag,
              amount: amount,
              row: i + 2
            });
          }
        }
      }
      
      // 3. СОРТИРОВКА
      Utils.sortPayments(payments);
      
      // 4. B7↓
      svodkaSheet.getRange('B7:B').clearContent();
      
      if (payments.length > 0) {
        const lines = payments.map(p => `${p.date}-${p.project}-${p.amount} руб-${p.tag}`);
        svodkaSheet.getRange(7, 2, lines.length, 1).setValues(lines.map(line => [line]));
        console.log(`✅ Сводка: ${payments.length} платежей (${monthText})`);
      } else {
        svodkaSheet.getRange('B7').setValue(`ℹ️ Платежей за ${monthText} нет`);
      }
      
    } catch(e) {
      console.error('❌ Svodka.update():', e.toString());
    }
  }
};
