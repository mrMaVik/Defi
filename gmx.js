// ========== GMX v4.4 — МИНИМАЛИЗИРОВАННЫЙ ==========
const RPC_URL = 'https://arb1.arbitrum.io/rpc';

function gmxMonitor() {
  console.time('GMX v4.4');
  const config = getConfig();
  if (!config?.WALLET) return console.error('❌ WALLET не найден!');
  
  const wallet = config.WALLET.toLowerCase();
  console.log('👛 WALLET:', wallet.slice(0, 5) + '...' + wallet.slice(-5));
  
  // 🔥 GraphQL — 1 запрос
  const data = JSON.parse(UrlFetchApp.fetch('https://gmx.squids.live/gmx-synthetics-arbitrum:prod/api/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    payload: JSON.stringify({
      query: `{
        marketInfos(limit: 10, orderBy: poolValueMax_DESC) {
          marketTokenAddress poolValue marketTokenSupply
        }
      }`
    }),
    muteHttpExceptions: true
  }).getContentText()).data.marketInfos;
  
  if (!data?.length) {
    console.error('❌ Нет пулов!');
    updateSheet([], wallet);
    return;
  }
  
  console.log(`✅ Пулов: ${data.length}`);
  
  // 🔥 RPC + ФИЛЬТР в 1 цикле
  const positions = [];
  data.forEach((market, i) => {
    const token = market.marketTokenAddress;
    if (!token) return;
    
    console.log(`\n📡 ${i+1}/10: ${token.slice(-8)}`);
    
    try {
      // decimals
      const decimalsHex = JSON.parse(UrlFetchApp.fetch(RPC_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        payload: JSON.stringify({
          jsonrpc: "2.0", method: "eth_call",
          params: [{to: token.toLowerCase(), data: '0x313ce567'}, "latest"],
          id: 1
        }),
        muteHttpExceptions: true
      }).getContentText()).result || '0x0';
      const decimals = parseInt(decimalsHex, 16);
      
      // balance
      const paddedWallet = '000000000000000000000000' + wallet.slice(2);
      const balanceHex = JSON.parse(UrlFetchApp.fetch(RPC_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        payload: JSON.stringify({
          jsonrpc: "2.0", method: "eth_call",
          params: [{to: token.toLowerCase(), data: '0x70a08231' + paddedWallet}, "latest"],
          id: 1
        }),
        muteHttpExceptions: true
      }).getContentText()).result || '0x0';
      
      const balance = +(parseInt(balanceHex, 16) / Math.pow(10, decimals)).toFixed(6);
      console.log(`💰 ${balance}`);
      
      if (balance > 0) {
        positions.push({
          token: token.slice(0, 5) + '...' + token.slice(-5),
          balance: balance.toFixed(6),
          poolUSD: (parseFloat(market.poolValue || 0) / 1e30).toLocaleString(),
          supply: (parseFloat(market.marketTokenSupply || 0) / 1e18).toLocaleString()
        });
        console.log(`✅ 🎉 ПОЗИЦИЯ: ${balance}`);
      }
    } catch (e) {
      console.error(`❌ RPC Error: ${e.message}`);
    }
    
    Utilities.sleep(200);
  });
  
  updateSheet(positions, wallet);
  console.log(`🎉 Позиций: ${positions.length}`);
  console.timeEnd('GMX v4.4');
}

function updateSheet(positions, wallet) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('GMX POSITIONS') || ss.insertSheet('GMX POSITIONS');
  sheet.clear();
  
  // Заголовки
  sheet.getRange(1, 1, 1, 4).setValues([['#', 'Token', 'Balance', 'Pool$/Supply']]);
  sheet.getRange('A1:D1').setFontWeight('bold').setBackground('#4285f4').setFontColor('white');
  
  if (!positions.length) {
    sheet.getRange(2, 1, 1, 4).setValues([['⭕ ПОЗИЦИЙ НЕ НАЙДЕНО', '', '', '']])
      .setFontWeight('bold').setBackground('#ea4335').setFontColor('white');
    return;
  }
  
  // Статистика + позиции
  const total = positions.reduce((sum, p) => sum + parseFloat(p.balance), 0);
  const rows = [[new Date().toLocaleString('ru-RU'), positions.length, wallet.slice(0, 5) + '...' + wallet.slice(-5), total.toFixed(6)],
                ...positions.map((p, i) => [i+1, p.token, p.balance, `${p.poolUSD}/${p.supply}`])];
  
  sheet.getRange(2, 1, rows.length, 4).setValues(rows);
  sheet.getRange('A2:D2').setFontWeight('bold').setBackground('#34a853').setFontColor('white');
  sheet.getRange(3, 1, positions.length, 4).setBackground('#fbbc04').setFontWeight('bold');
  
  [50, 150, 100, 200].forEach((w, i) => sheet.setColumnWidth(i + 1, w));
}

function testGMX() { 
  clearConfigCache?.();
  gmxMonitor(); 
}
