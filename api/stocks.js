const https = require('https');

const LICENCE = '82556EEC-5CB3-4BD2-9BBD-9C26A0ED5A97';

// 50只热门A股（精选高交易量股票）
const HOT_STOCKS = [
    '600519','000858','300750','002594','000333','000651','600036','601318','000725','002415',
    '600000','601398','601988','600030','000001','600276','600887','000568','002304','600900',
    '601012','600309','601899','600031','002475','601166','000063','002352','603288','600809',
    '300059','002230','000538','600196','601668','601390','600048','600011','601985','600585',
    '000423','002460','600219','601100','000630','002466','600426','601688','601601','601328'
];

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        // 一次性并发获取所有股票
        const results = await Promise.allSettled(
            HOT_STOCKS.map(code => fetchStock(code))
        );
        
        const stocks = results
            .filter(r => r.status === 'fulfilled' && r.value !== null)
            .map(r => r.value);

        // 按成交量排序
        stocks.sort((a, b) => b.volume - a.volume);

        res.status(200).json({ 
            success: true, 
            data: stocks, 
            count: stocks.length, 
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(200).json({ success: false, error: error.message, data: [] });
    }
};

async function fetchStock(code) {
    try {
        const d = await fetchAPI(`https://api.mairui.club/hsrl/ssjy/${code}/${LICENCE}`);
        if (d && d.p) {
            return {
                code: code,
                name: d.mc || code,
                price: parseFloat(d.p) || 0,
                change: parseFloat(d.pc) || 0,
                pe: parseFloat(d.pe) || 0,
                pb: parseFloat(d.sjl) || 0,
                roe: 0,
                volume: parseFloat(d.v) || 0,
                amount: parseFloat(d.cje) || 0,
                turnover: parseFloat(d.hs) || 0,
                high: parseFloat(d.h) || 0,
                low: parseFloat(d.l) || 0,
                open: parseFloat(d.o) || 0,
                industry: getIndustry(code)
            };
        }
    } catch (e) { }
    return null;
}

function fetchAPI(url) {
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => resolve(null), 3000);
        https.get(url, (resp) => {
            let data = '';
            resp.on('data', chunk => data += chunk);
            resp.on('end', () => {
                clearTimeout(timeout);
                try { resolve(JSON.parse(data)); }
                catch (e) { resolve(null); }
            });
        }).on('error', () => {
            clearTimeout(timeout);
            resolve(null);
        });
    });
}

function getIndustry(code) {
    const ind = {
        '600036':'finance','601318':'finance','600000':'finance','601398':'finance','601988':'finance',
        '601166':'finance','000001':'finance','600030':'finance','601688':'finance','601601':'finance',
        '600519':'consumer','000858':'consumer','000333':'consumer','000651':'consumer','600887':'consumer',
        '000568':'consumer','002304':'consumer','603288':'consumer','600809':'consumer',
        '300750':'tech','002594':'tech','002415':'tech','000725':'tech','300059':'tech',
        '002230':'tech','002475':'tech','000063':'tech',
        '600276':'healthcare','000538':'healthcare','600196':'healthcare',
        '600900':'energy','601012':'energy','600011':'energy','601985':'energy',
        '600309':'material','601899':'material','600585':'material','000423':'material',
        '600031':'industrial','601668':'industrial','601390':'industrial','600048':'industrial','002352':'industrial'
    };
    return ind[code] || 'other';
}
