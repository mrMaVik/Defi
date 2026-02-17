/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 🔧 UTILS.GS v2.1 — Универсальные функции + AAVE! (Europe/Moscow!)
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * 📋 Функции:
 * • getTodayStart() — 00:00:00 сегодня
 * • formatDate() — dd.MM.yyyy (Europe/Moscow!)
 * • daysDiff() — разница в днях
 * • createTrigger() — триггер по B5 (MSK)
 * • sortPayments() — Дата→Проект→Тип
 * • sortPositions() — USD↓ → Asset ⭐ НОВОЕ!
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const Utils = {
  getTodayStart() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  },
  
  formatDate(date, format = 'dd.MM.yyyy') {
    try {
      if (!(date instanceof Date)) {
        date = new Date(date);
      }
      if (isNaN(date.getTime())) {
        return '❌ INVALID DATE';
      }
      return Utilities.formatDate(date, 'Europe/Moscow', format);
    } catch(e) {
      console.error('formatDate error:', e);
      return '❌ DATE ERROR';
    }
  },
  
  daysDiff(date1, date2) {
    const d1 = new Date(date1); d1.setHours(0, 0, 0, 0);
    const d2 = new Date(date2); d2.setHours(0, 0, 0, 0);
    return Math.floor((d1 - d2) / (1000 * 60 * 60 * 24));
  },
  
  createTrigger(handlerName) {
    try {
      const config = getConfig();
      const hour = config.TRIGGER_HOUR;
      
      if (!hour || hour < 0 || hour > 23) {
        throw new Error('Настройки!B5: ЧАС 0-23 (9=09:00 MSK)');
      }
      
      // Удаляем старые
      ScriptApp.getProjectTriggers().forEach(trigger => {
        if (trigger.getHandlerFunction() === handlerName) {
          ScriptApp.deleteTrigger(trigger);
        }
      });
      
      // 🔥 НОВЫЙ триггер по B5!
      ScriptApp.newTrigger(handlerName)
        .timeBased()
        .everyDays(1)
        .atHour(hour)
        .create();
      
      console.log(`✅ Триггер "${handlerName}" → ${hour}:00 MSK!`);
      return true;

    } catch(e) {
      console.error('❌ createTrigger:', e.toString());
      return false;
    }
  },
  
  /** 
   * 🗂️ СОРТИРОВКА ПЛАТЕЖЕЙ: Дата → Проект → Тип
   */
  sortPayments(payments) {
    payments.sort((a, b) => {
      // 1️⃣ ДАТА (31.01 < 01.02)
      const dateA = new Date(a.date.split('.').reverse().join('-'));
      const dateB = new Date(b.date.split('.').reverse().join('-'));
      if (dateA.getTime() !== dateB.getTime()) {
        return dateA.getTime() - dateB.getTime();
      }
      
      // 2️⃣ ПРОЕКТ (test-01 < проект-01)
      if (a.project !== b.project) {
        return a.project.localeCompare(b.project);
      }
      
      // 3️⃣ ТИП (Проценты < Тело)
      return a.tag.localeCompare(b.tag);
    });
  },
  
  /** 
   * 🗂️ СОРТИРОВКА AAVE: USD ↓ → Asset → Network ⭐ НОВОЕ!
   */
  sortPositions(positions) {
    positions.sort((a, b) => {
      // 1️⃣ USD ↓ (высокие сверху!)
      if (a.usdValue !== b.usdValue) {
        return b.usdValue - a.usdValue;
      }
      
      // 2️⃣ ASSET (ETH < USDC)
      if (a.asset !== b.asset) {
        return a.asset.localeCompare(b.asset);
      }
      
      // 3️⃣ NETWORK (Base < Polygon)
      return a.network.localeCompare(b.network);
    });
  }
};
