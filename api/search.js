const https = require('https');

const LICENCE = '82556EEC-5CB3-4BD2-9BBD-9C26A0ED5A97';

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    if (req.method === 'OPTIONS') return res.status(200).end();

    const { code } = req.query;
    
    if (!code) {
        return res.status(200).json({ success: false, error: '请提供股票代码' });
    }

    try {
        const data = await fetchAPI(`https://api.mairui.club/hsrl/ssjy/${code}/${LICENCE}`);
        
        if (data && data.p) {
            const stock = {
                code: code,
                price: parseFloat(data.p) || 0,
                change: parseFloat(data.pc) || 0,
                pe: parseFloat(data.pe) || 0,
                pb: parseFloat(data.sjl) || 0,
                high: parseFloat(data.h) || 0,
                low: parseFloat(data.l) || 0,
                open: parseFloat(data.o) || 0,
                close: parseFloat(data.yc) || 0,
                volume: data.v || 0,
                amount: parseFloat(data.cje) || 0,
                turnover: parseFloat(data.hs) || 0,
                amplitude: parseFloat(data.zf) || 0,
                marketCap: parseFloat(data.sz) || 0,
                floatCap: parseFloat(data.lt) || 0
            };
            return res.status(200).json({ success: true, data: stock });
        }
        
        res.status(200).json({ success: false, error: '未找到该股票' });
    } catch (error) {
        res.status(200).json({ success: false, error: error.message });
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
