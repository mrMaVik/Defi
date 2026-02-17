/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 🪙 AAVE.GS v2.4.12.1 — Health Factor мониторинг (Base Chain) + Шаговый спуск!
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * 📱 Логика алертов (каждые 15 мин):
 * 1. HF > 30 → lastHF = 30.0 (СБРОС!)
 * 2. HF ≤ 30 && HF ≤ lastHF → Telegram + lastHF -= 0.01
 * 3. lastHF НЕ меняется при росте HF
 * 4. Лист "Aave": NOVA A1:G1 + ✅ ULTRA-FIX столбцов!
 * 
 * 📊 Sheets: Aave | Настройки: B2=Token, B3=Chat ID, B9=WALLET
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const Aave = {
  getConfig() {
    const config = getConfig();
    return {
      WALLET: config.AAVE_WALLET || '0x60452b15dc656b37a2bbb6dcb02c2bce9cb29353'.toLowerCase(),
      HF_ALERT: parseFloat(config.HF_ALERT) || 30.0,
      HF_YELLOW: parseFloat(config.HF_YELLOW) || 30.0,
      HF_RED: parseFloat(config.HF_RED) || 28.0,
      HF_DROP: parseFloat(config.HF_DROP) || 0.01
    };
  },

  BASE_POOL: '0xA238Dd80C259a72e81d7e4664a9801593F98d1c5',
  BASE_CHAIN: 8453,

  check() {
    console.time('Aave.v2.4.12');
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Aave') || ss.insertSheet('Aave');
    sheet.getRange('A1:G20').clearContent();
    
    const config = this.getConfig();
    
    try {
      const query = {
        query: 'query($r:UserSuppliesRequest!,$b:UserBorrowsRequest!,$m:UserMarketStateRequest!){userSupplies(request:$r){balance{amount{value}usd}currency{symbol}apy{formatted}}userBorrows(request:$b){currency{symbol}debt{amount{value}usd}apy{formatted}}userMarketState(request:$m){healthFactor netWorth netAPY{formatted} totalCollateralBase totalDebtBase currentLiquidationThreshold{formatted} availableBorrowsBase }health}',
        variables: {
          r: {user:config.WALLET,markets:[{address:this.BASE_POOL,chainId:this.BASE_CHAIN}]},
          b: {user:config.WALLET,markets:[{address:this.BASE_POOL,chainId:this.BASE_CHAIN}]},
          m: {user:config.WALLET,chainId:this.BASE_CHAIN,market:this.BASE_POOL}
        }
      };
      
      const response = UrlFetchApp.fetch('https://api.v3.aave.com/graphql', {
        method: 'POST', 
        headers: {'Content-Type':'application/json'},
        payload: JSON.stringify(query), 
        muteHttpExceptions: true
      });
      
      const data = JSON.parse(response.getContentText());
      if (!data.data || !data.data.health) {
        throw new Error('API DOWN или кошелёк пустой: ' + config.WALLET);
      }
      
      const supplies = data.data.userSupplies || [];
      const borrows = data.data.userBorrows || [];
      const state = data.data.userMarketState;
      
      const hfRaw = state.healthFactor;
      const hf = parseFloat(hfRaw.replace(/[^\d.]/g, '')) || 0;
      if (hf === 0) {
        throw new Error(`Некорректный HF: "${hfRaw}"`);
      }
      
      const nw = parseFloat(state.netWorth) || 0;
      const netApy = state.netAPY ? state.netAPY.formatted : '0.00';
      const debt = parseFloat(state.totalDebtBase) || 0;
      const lt = parseFloat(state.currentLiquidationThreshold.formatted)/100 || 0;
      const availBorrows = parseFloat(state.availableBorrowsBase) || 0;
      
      let ethAmt = 0, ethUsd = 0, usdcUsd = 0;
      supplies.forEach(p => {
        if (p.currency.symbol === 'WETH') {
          ethAmt = parseFloat(p.balance.amount.value) || 0;
          ethUsd = parseFloat(p.balance.usd) || 0;
        } else if (p.currency.symbol === 'USDC') {
          usdcUsd = parseFloat(p.balance.usd) || 0;
        }
      });
      
      const ethPrice = ethAmt > 0 ? ethUsd / ethAmt : 0;
      const liqPrice = ethAmt > 0 ? (debt/lt - usdcUsd) / ethAmt : 0;
      const dropPct = ethPrice > 0 ? ((ethPrice-liqPrice)/ethPrice*100).toFixed(1) : '0.0';
      const borrowPwr = (debt+availBorrows > 0) ? ((debt/(debt+availBorrows))*100).toFixed(2) : '0.00';
      
      const properties = PropertiesService.getScriptProperties();
      let lastHF = parseFloat(properties.getProperty('aaveLastHF') || config.HF_ALERT.toString());
      
      let sendTelegram = false;
      let alertType = '';
      
      if (hf > config.HF_ALERT) {
        lastHF = config.HF_ALERT;
        properties.setProperty('aaveLastHF', lastHF.toString());
        console.log('🔄 HF=' + hf.toFixed(2) + ' > ' + config.HF_ALERT + ' → СБРОС lastHF=' + lastHF);
      }
      else if (hf <= config.HF_ALERT && hf <= lastHF) {
        sendTelegram = true;
        alertType = 'HF_' + lastHF.toFixed(2);
        lastHF = lastHF - config.HF_DROP;
        properties.setProperty('aaveLastHF', lastHF.toFixed(3));
        console.log('🚨 TELEGRAM! HF=' + hf.toFixed(2) + ' ≤ ' + (parseFloat(lastHF + config.HF_DROP).toFixed(3)) + ' → Новый lastHF=' + lastHF.toFixed(3));
      }
      
      const currentLastHF = parseFloat(properties.getProperty('aaveLastHF') || config.HF_ALERT.toString());
      console.log('📊 HF:' + hf.toFixed(2) + ' | lastHF:' + currentLastHF.toFixed(3) + ' | Telegram:' + (sendTelegram ? '✅ ' + alertType : '❌'));
      
      if (sendTelegram) {
        let message = '<b>🚨 AAVE HF ALERT v2.4.12!</b>\n\n';
        message += '<b>📊 HF:</b> <b>' + hf.toFixed(2) + '</b> (' + alertType + ')\n';
        message += '<b>📉 Порог:</b> <code>' + (currentLastHF + config.HF_DROP).toFixed(3) + '</code>\n';
        message += '<b>💰 Net Worth:</b> <code>$' + nw.toFixed(0) + '</code>\n';
        message += '<b>⚠️ Liq ETH:</b> <code>$' + liqPrice.toFixed(0) + '</code>\n';
        message += '<b>📉 Drop:</b> <code>' + dropPct + '%</code>\n\n';
        
        supplies.forEach(pos => {
          message += '📥 <b>' + pos.currency.symbol + ':</b> <code>$' + parseFloat(pos.balance.usd).toFixed(0) + '</code>\n';
        });
        borrows.forEach(pos => {
          message += '💸 <b>' + pos.currency.symbol + ':</b> <code>$' + parseFloat(pos.debt.usd).toFixed(0) + '</code>\n';
        });
        
        message += '\n<i>Новый порог: ' + currentLastHF.toFixed(3) + '</i>';
        Telegram.send(message);
      }
      
      // ✅ v2.4.12: updateSheet ДО catch!
      this.updateSheet(sheet, hf, nw, liqPrice, dropPct, borrowPwr, netApy, supplies, borrows, config);
      
      console.timeEnd('Aave.v2.4.12');
      console.log('✅ v2.4.12: HF=' + hf.toFixed(2) + ' | lastHF=' + currentLastHF.toFixed(3) + ' | Позиций: ' + supplies.length);
      return supplies.concat(borrows);
      
    } catch(e) {
      console.error('❌ Aave.v2.4.12 ERROR:', e.toString());
      sheet.getRange('A1:G1').setValues([['ERROR', e.toString(), '', '', '', '', '']]);
      sheet.getRange('A1:G1').setBackground('#ea4335').setFontColor('white').setFontWeight('bold');
      console.timeEnd('Aave.v2.4.12');
      return [];
    }
  },

  // 🔥 v2.4.12 ULTRA-FIX: НИКОГДА не будет column mismatch!
  updateSheet(sheet, hf, nw, liqPrice, dropPct, borrowPwr, netApy, supplies, borrows, config) {
    // 🎯 1. A1:G1 — ГАРАНТИРОВАННО 6 ячеек!
    const row1 = [
      'NET WORTH', 
      '$' + nw.toFixed(0), 
      'Net APY', 
      netApy + '%', 
      'HF', 
      hf.toFixed(2).replace('.', ',')
    ];
    sheet.getRange('A1:F1').setValues([row1]);  // ← ТОЛЬКО A1:F1!
    
    // 🎯 2. A2:G2 — ГАРАНТИРОВАННО 7 ячеек!
    const row2 = [
      'Liq ETH', 
      '$' + liqPrice.toFixed(0), 
      'Drop%', 
      dropPct + '%', 
      '', 
      'Borrow Power', 
      borrowPwr + '%'
    ];
    sheet.getRange('A2:G2').setValues([row2]);
    
    // 🎯 3. Заголовок A3:G3 — ГАРАНТИРОВАННО 7 ячеек!
    const headerRow = ['Asset','Supply','Borrow','Supply$','Borrow$','S.APY','B.APY'];
    sheet.getRange('A3:G3').setValues([headerRow]);
    
    // 🧮 Активы
    const assets = {};
    Array.prototype.forEach.call(supplies.concat(borrows), pos => {
      const sym = pos.currency.symbol;
      if (!assets[sym]) assets[sym] = {s:0,su:0,sa:'0.00',b:0,bu:0,ba:'0.00'};
      if (pos.balance) {
        assets[sym].s = parseFloat(pos.balance.amount.value) || 0;
        assets[sym].su = parseFloat(pos.balance.usd) || 0;
        assets[sym].sa = pos.apy ? pos.apy.formatted : '0.00';
      } else if (pos.debt) {
        assets[sym].b = parseFloat(pos.debt.amount.value) || 0;
        assets[sym].bu = parseFloat(pos.debt.usd) || 0;
        assets[sym].ba = pos.apy ? pos.apy.formatted : '0.00';
      }
    });
    
    // 📊 Таблица — ГАРАНТИРОВАННО 7 столбцов!
    const assetRows = Object.keys(assets).map(sym => {
      const asset = assets[sym];
      return [
        sym,
        asset.s > 0 ? (sym === 'WETH' ? asset.s.toFixed(8) : asset.s.toFixed(6)) : '0',
        asset.b > 0 ? (sym === 'WETH' ? asset.b.toFixed(8) : asset.b.toFixed(6)) : '0',
        '$' + asset.su.toFixed(0),
        '$' + asset.bu.toFixed(0),
        asset.sa + '%',
        asset.ba + '%'
      ];
    });
    
    // ✅ Заполняем таблицу ПОСЛЕДОВАТЕЛЬНО — никаких batch-ошибок!
    if (assetRows.length > 0) {
      sheet.getRange(4, 1, assetRows.length, 7).setValues(assetRows);
    }
    
    // 🎨 Форматирование — точечное!
    sheet.getRange('A1:F1').setFontWeight('bold').setFontColor('white').setBackground('#4285f4');
    
    // HF цвет только для F1 (5-я колонка)
    const hfCell = sheet.getRange('F1');
    if (hf < config.HF_RED) {
      hfCell.setBackground('#ea4335').setFontColor('white').setFontWeight('bold');
    } else if (hf < config.HF_YELLOW) {
      hfCell.setBackground('#fbbc04').setFontColor('white').setFontWeight('bold');
    } else {
      hfCell.setBackground('#34a853').setFontColor('white').setFontWeight('bold');
    }
    
    sheet.getRange('A2:G2').setFontWeight('bold').setBackground('#fbbc04').setFontColor('white');
    sheet.getRange('A3:G3').setFontWeight('bold').setBackground('#34a853').setFontColor('white');
    
    sheet.autoResizeColumns(1, 7);
  }
}
