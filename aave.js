/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 🪙 AAVE.GS v2.4.16 — HF мониторинг (Base) + ✅ Только HF_ALERT!
 * ═══════════════════════════════════════════════════════════════════════════════
 * 📱 Унифицировано: HF_TARGET → HF_ALERT | Telegram + Sheets готовы!
 */

const Aave = {
  getConfig() {
    const config = getConfig();
    return {
      WALLET: config.WALLET || ''.toLowerCase(),
      HF_ALERT: parseFloat(config.HF_ALERT) || 30.0,
      HF_YELLOW: parseFloat(config.HF_YELLOW) || 30.0,
      HF_RED: parseFloat(config.HF_RED) || 28.0,
      HF_DROP: parseFloat(config.HF_DROP) || 0.01
    };
  },

  BASE_POOL: '0xA238Dd80C259a72e81d7e4664a9801593F98d1c5',
  BASE_CHAIN: 8453,

  check() {
    console.time('Aave.v2.4.16');
    
    const lock = LockService.getScriptLock();
    try {
      lock.waitLock(1000);
    } catch(e) {
      console.log('🔒 Lock timeout');
      console.timeEnd('Aave.v2.4.16');
      return [];
    }
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Aave') || ss.insertSheet('Aave');
    sheet.getRange('A1:G20').clearContent();
    
    const config = this.getConfig();
    
    try {
      const query = {
        query: `query($r:UserSuppliesRequest!,$b:UserBorrowsRequest!,$m:UserMarketStateRequest!,$market:MarketRequest!,$markets:MarketsRequest!){
          userSupplies(request:$r){balance{amount{value} usd} currency{symbol} apy{formatted}}
          userBorrows(request:$b){currency{symbol} debt{amount{value} usd} apy{formatted}}
          userMarketState(request:$m){
            healthFactor netWorth netAPY{formatted} ltv{formatted} currentLiquidationThreshold{formatted}
            totalCollateralBase totalDebtBase availableBorrowsBase
          }
          market(request:$market){
            reserves{
              aToken{symbol} supplyInfo{liquidationThreshold{formatted}}
              userState{balance{usd}}
            } address name
          }
          markets(request:$markets){userState{availableBorrowsBase currentLiquidationThreshold{formatted}}}
          health
        }`,
        variables: {
          r: {user:config.WALLET, markets:[{address:this.BASE_POOL, chainId:this.BASE_CHAIN}]},
          b: {user:config.WALLET, markets:[{address:this.BASE_POOL, chainId:this.BASE_CHAIN}]},
          m: {user:config.WALLET, chainId:this.BASE_CHAIN, market:this.BASE_POOL},
          market: {user:config.WALLET, chainId:this.BASE_CHAIN, address:this.BASE_POOL},
          markets: {chainIds:[this.BASE_CHAIN], user:config.WALLET}
        }
      };
      
      const response = UrlFetchApp.fetch('https://api.v3.aave.com/graphql', {
        method: 'POST', 
        headers: {'Content-Type':'application/json'},
        payload: JSON.stringify(query), 
        muteHttpExceptions: true
      });
      
      if (response.getResponseCode() !== 200) {
        throw new Error('HTTP ' + response.getResponseCode());
      }
      
      const data = JSON.parse(response.getContentText());
      
      if (!data.data?.userMarketState) {
        console.log('ℹ️ Нет активных позиций:', config.WALLET);
        sheet.getRange('A1:G1').setValues([['NO POSITIONS', config.WALLET, '✅ Safe', '', '', '', '']]);
        sheet.getRange('A1:G1').setBackground('#34a853').setFontColor('white').setFontWeight('bold');
        return [];
      }
      
      const supplies = data.data.userSupplies || [];
      const borrows = data.data.userBorrows || [];
      const state = data.data.userMarketState;
      const reserves = data.data.market?.reserves || [];
      
      const hf = parseFloat(state.healthFactor) || 0;
      const nw = parseFloat(state.netWorth) || 0;
      const netApy = state.netAPY?.formatted || '0.00';
      const debt = parseFloat(state.totalDebtBase) || 0;
      const collateralBase = parseFloat(state.totalCollateralBase) || 0;
      const lt = parseFloat(state.currentLiquidationThreshold.formatted)/100 || 0;
      const ltv = parseFloat(state.ltv?.formatted || '0')/100 || 0;
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
      
      // ✅ HF_ALERT везде!
      const addCollateralUsd = this.calculateCollateralNeeded(hf, collateralBase, debt, config.HF_ALERT, lt, reserves);
      
      const properties = PropertiesService.getScriptProperties();
      let lastHF = parseFloat(properties.getProperty('aaveLastHF') || config.HF_ALERT.toString());
      
      let sendTelegram = false;
      let alertType = '';
      
      if (hf > config.HF_ALERT) {
        lastHF = config.HF_ALERT;
        properties.setProperty('aaveLastHF', lastHF.toString());
        console.log('🔄 СБРОС lastHF=' + lastHF);
      } else if (hf <= config.HF_ALERT && hf <= lastHF) {
        sendTelegram = true;
        alertType = 'HF_' + lastHF.toFixed(3);
        lastHF -= config.HF_DROP;
        properties.setProperty('aaveLastHF', lastHF.toFixed(3));
        console.log('🚨 TELEGRAM! HF=' + hf.toFixed(2));
      }
      
      const currentLastHF = parseFloat(properties.getProperty('aaveLastHF') || config.HF_ALERT.toString());
      
      if (sendTelegram) {
        let message = '<b>🚨 AAVE HF ALERT v2.4.16!</b>\n\n';
        message += '<b>📊 HF:</b> <b>' + hf.toFixed(2) + '</b> (' + alertType + ')\n';
        message += '<b>💰 Net:</b> <code>$' + nw.toFixed(0) + '</code> | <b>LTV:</b> <code>' + (ltv*100).toFixed(1) + '%</code>\n';
        message += '<b>⚠️ Liq ETH:</b> <code>$' + liqPrice.toFixed(0) + '</code> | <b>📉 Drop:</b> <code>' + dropPct + '%</code>\n';
        message += '<b>➕ Для HF=' + config.HF_ALERT + ':</b> <code>$' + addCollateralUsd.toFixed(0) + '</code>\n';
        message += '<b>Порог:</b> <code>' + currentLastHF.toFixed(3) + '</code>';
        Telegram.send(message);
      }
      
      // ✅ Передаем extra данные
      this.updateSheet(sheet, hf, nw, liqPrice, dropPct, netApy, supplies, borrows, config, {
        collateralBase, debt, lt, reserves
      });
      
      console.timeEnd('Aave.v2.4.16');
      console.log('✅ v2.4.16: HF=' + hf.toFixed(2) + ' | Add для ' + config.HF_ALERT + ': $' + addCollateralUsd.toFixed(0));
      return supplies.concat(borrows);
      
    } catch(e) {
      console.error('❌ ERROR:', e.toString());
      sheet.getRange('A1:G1').setValues([['ERROR', e.toString(), '', '', '', '', '']]);
      sheet.getRange('A1:G1').setBackground('#ea4335').setFontColor('white').setFontWeight('bold');
      return [];
    } finally {
      lock.releaseLock();
    }
  },

  calculateCollateralNeeded(currentHF, collateralBase, debtBase, targetHF, currentLt, reserves) {
    if (currentHF >= targetHF) return 0;
    
    const wethReserve = reserves.find(r => r.aToken.symbol.includes('WETH'));
    const wethLt = wethReserve?.supplyInfo?.liquidationThreshold 
      ? parseFloat(wethReserve.supplyInfo.liquidationThreshold.formatted)/100 : 0.83;
    
    const currentAdjusted = currentHF * debtBase;
    const targetAdjusted = targetHF * debtBase;
    const addAdjusted = targetAdjusted - currentAdjusted;
    
    return Math.max(0, addAdjusted / wethLt);
  },

  updateSheet(sheet, hf, nw, liqPrice, dropPct, netApy, supplies, borrows, config, extra) {
    const { collateralBase = 0, debt = 0, lt = 0, reserves = [] } = extra || {};
    
    const row1 = ['NET WORTH', '$' + nw.toFixed(2), 'Net APY', netApy + '%', 'HF', hf.toFixed(3).replace('.', ',')];
    sheet.getRange('A1:F1').setValues([row1]);
    
    // 🆕 Add Collateral для HF_ALERT вместо Borrow Power
    const addForAlertUsd = this.calculateCollateralNeeded(hf, collateralBase, debt, config.HF_ALERT, lt, reserves);
    const row2 = [
      'Liq ETH', 
      '$' + liqPrice.toFixed(0), 
      'Drop%', 
      dropPct + '%', 
      'Add to HF-' + config.HF_ALERT, 
      '$' + addForAlertUsd.toFixed(0),
      ''      
    ];
    sheet.getRange('A2:G2').setValues([row2]);
    
    const headerRow = ['Asset','Supply','Borrow','Supply$','Borrow$','S.APY','B.APY'];
    sheet.getRange('A3:G3').setValues([headerRow]);
    
    const assets = {};
    Array.prototype.forEach.call(supplies.concat(borrows), pos => {
      const sym = pos.currency.symbol;
      if (!assets[sym]) assets[sym] = {s:0,su:0,sa:'0.00',b:0,bu:0,ba:'0.00'};
      if (pos.balance) {
        assets[sym].s = parseFloat(pos.balance.amount.value) || 0;
        assets[sym].su = parseFloat(pos.balance.usd) || 0;
        assets[sym].sa = pos.apy?.formatted || '0.00';
      } else if (pos.debt) {
        assets[sym].b = parseFloat(pos.debt.amount.value) || 0;
        assets[sym].bu = parseFloat(pos.debt.usd) || 0;
        assets[sym].ba = pos.apy?.formatted || '0.00';
      }
    });
    
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
    
    if (assetRows.length > 0) {
      sheet.getRange(4, 1, assetRows.length, 7).setValues(assetRows);
    }
    
    sheet.getRange('A1:F1').setFontWeight('bold').setFontColor('white').setBackground('#4285f4');
    const hfCell = sheet.getRange('F1');
    if (hf < config.HF_RED) hfCell.setBackground('#ea4335').setFontColor('white').setFontWeight('bold');
    else if (hf < config.HF_YELLOW) hfCell.setBackground('#fbbc04').setFontColor('white').setFontWeight('bold');
    else hfCell.setBackground('#34a853').setFontColor('white').setFontWeight('bold');
    
    sheet.getRange('A2:G2').setFontWeight('bold').setBackground('#fbbc04').setFontColor('white');
    sheet.getRange('A3:G3').setFontWeight('bold').setBackground('#34a853').setFontColor('white');
    sheet.autoResizeColumns(1, 7);
    sheet.setColumnWidth(1, 80);   // A: названия
    sheet.setColumnWidth(5, 90);  // E: "Add to HF-30"
    sheet.setColumnWidth(2, 90);   // B: суммы
  }
};
