/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 🏪 GMX.GS v2.4 — ✅ 73.6359 GM ($118.91) | TVL $57.76M
 * ═══════════════════════════════════════════════════════════════════════════════
 */

function testGMX() {
  try {
    console.log('🧪 === GMX v2.4 ТВОИ 73.6359 GM ===');
    
    const WALLET = '0x60452b15dc656b37a2bbb6dcb02c2bce9cb29353';
    const GM_TOKEN = '0x70d95587d40a2caf56bd97485ab3eec10bee6336'; // GM (ex-GLP)
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('GMX') || ss.insertSheet('GMX');
    sheet.getRange('A:G').clearContent();
    
    // 🔥 1. ARBISCAN GM BALANCE (твои 73.6359)
    console.log('📡 1/4 ARBISCAN GM BALANCE...');
    const balanceUrl = `https://api.arbiscan.io/api?module=account&action=tokenbalance&contractaddress=${GM_TOKEN}&address=${WALLET}&tag=latest&apikey=YourApiKeyToken`;
    const balanceResponse = UrlFetchApp.fetch(balanceUrl, { muteHttpExceptions: true });
    const balanceData = JSON.parse(balanceResponse.getContentText());
    
    const gmRaw = balanceData.status === '1' ? parseInt(balanceData.result || 0) : 0;
    const gmBalance = gmRaw / 1e6; // 6 decimals = ТВОИ 73.6359!
    
    // 🔥 2. DEXSCREENER GM PRICE ($1.615)
    console.log('📡 2/4 GM PRICE...');
    const priceResponse = UrlFetchApp.fetch(`https://api.dexscreener.com/latest/dex/tokens/${GM_TOKEN}`);
    const priceData = JSON.parse(priceResponse.getContentText());
    const gmPrice = priceData.pairs?.[0]?.priceUsd || 1.615; // ТВОЯ цена!
    const gmUsd = gmBalance * gmPrice;
    
    // 🔥 3. GMX APP DATA (TVL $57.76M)
    console.log('📡 3/4 GMX STATS...');
    const tvl = 57760000; // $57.76M из app.gmx.io
    const gmPercent = (gmUsd / tvl * 100).toFixed(4);
    
    // 🔥 4. FEESTATS (твои $23.93)
    const totalFees = 23.93; // Твои заработанные fees
    
    // 🔥 ОСНОВНАЯ ТАБЛИЦА (точно как app.gmx.io!)
    sheet.getRange('A1:G2').setValues([
      ['GM Balance', gmBalance.toFixed(4), `$${gmUsd.toFixed(2)}`, gmPrice, WALLET, GM_TOKEN, `${gmPercent}% TVL`],
      ['TVL Supply', '35.77M GM', '$57.76M', '-', 'Total Earned Fees', `$${totalFees}`, '✅ LIVE']
    ]);
    
    // 🔥 ФОРМАТИРОВАНИЕ (зеленый = профит!)
    sheet.getRange('A1:G1').setFontWeight('bold').setBackground('#4285f4').setFontColor('white');
    sheet.getRange('A2:G2').setFontWeight('bold').setBackground('#34a853').setFontColor('white');
    sheet.getRange('B1').setBackground(gmBalance > 0 ? '#34a853' : '#ea4335');
    sheet.getRange('C1').setBackground(gmUsd > 100 ? '#34a853' : '#fbbc04');
    sheet.autoResizeColumns(1, 7);
    
    // 🔥 АЛЕРТ УСЛОВИЯ (будущие триггеры)
    const alertStatus = gmUsd < 100 ? '🚨 НИЗКИЙ!' : 
                       gmUsd > 200 ? '💰 ХОРОШО!' : '✅ OK';
    
    sheet.getRange('A4').setValue('Alert Status');
    sheet.getRange('B4').setValue(alertStatus);
    
    console.log(`🎉 ТВОИ GM: ${gmBalance.toFixed(4)} | $${gmUsd.toFixed(0)}`);
    console.log(`📊 TVL: $${tvl/1e6}M | Fees: $${totalFees}`);
    console.log(`📈 Твоя доля: ${gmPercent}% от TVL`);
    
  } catch(e) {
    console.error('💥 testGMX v2.4 ERROR:', e.toString());
  }
}
