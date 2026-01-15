const https = require('https');

const LICENCE = '82556EEC-5CB3-4BD2-9BBD-9C26A0ED5A97';

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        // 获取成交量排名前100的股票
        const rankData = await fetchAPI(`https://api.mairui.club/hsmy/cjl/${LICENCE}`);
        
        if (!rankData || !Array.isArray(rankData)) {
            return res.status(200).json({ success: false, error: '获取排行数据失败', data: [] });
        }

        // 取前100只
        const top100 = rankData.slice(0, 100);
        
        // 构建股票数据
        const stocks = top100.map((item, index) => ({
            code: item.dm,
            name: item.mc,
            price: parseFloat(item.p) || 0,
            change: parseFloat(item.pc) || 0,
            pe: parseFloat(item.syl) || 0,
            pb: parseFloat(item.sjl) || 0,
            roe: 0,
            volume: parseFloat(item.cjl) || 0,
            amount: parseFloat(item.cje) || 0,
            turnover: parseFloat(item.hs) || 0,
            high: parseFloat(item.h) || 0,
            low: parseFloat(item.l) || 0,
            open: parseFloat(item.o) || 0,
            industry: 'other',
            rank: index + 1
        }));

        res.status(200).json({ 
            success: true, 
            data: stocks, 
            count: stocks.length, 
            timestamp: new Date().toISOString(),
            source: '成交量排行TOP100'
        });
    } catch (error) {
        res.status(200).json({ success: false, error: error.message, data: [] });
    }
};

function fetchAPI(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (resp) => {
            let data = '';
            resp.on('data', chunk => data += chunk);
            resp.on('end', () => {
                try { resolve(JSON.parse(data)); }
                catch (e) { reject(e); }
            });
        }).on('error', reject);
    });
}
