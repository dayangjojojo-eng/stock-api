const https = require('https');

const LICENCE = '82556EEC-5CB3-4BD2-9BBD-9C26A0ED5A97';

// 100只热门A股（按市值和交易活跃度精选）
const HOT_STOCKS = [
    // 金融
    '600036','601318','600000','601398','601988','601166','000001','600030','601688','601601',
    '601328','600016','601818','601288','000002','601229','601998','600015','601169','002142',
    // 消费
    '600519','000858','000333','000651','600887','000568','002304','603288','600809','000895',
    '002714','600600','000596','603369','000869','600132','002557','600779','000799','603589',
    // 科技
    '300750','002594','002415','000725','300059','002230','300760','002475','000063','600588',
    '002049','300124','300496','002371','300033','002241','300015','603501','688981','688012',
    // 医药
    '600276','000538','300760','002007','600196','300122','000661','002422','300347','600867',
    // 能源
    '600900','601012','600011','601985','600886','000883','601225','600025','600795','002129',
    // 材料
    '600309','601899','600585','000423','002460','600219','601100','000630','002466','600426',
    // 工业
    '600031','000002','601668','601390','600048','000157','601800','600690','002352','601111'
];

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        // 并发获取100只股票数据（分批处理避免超时）
        const batchSize = 20;
        const allStocks = [];
        
        for (let i = 0; i < HOT_STOCKS.length; i += batchSize) {
            const batch = HOT_STOCKS.slice(i, i + batchSize);
            const results = await Promise.all(
                batch.map(code => fetchStock(code))
            );
            allStocks.push(...results.filter(s => s !== null));
        }

        // 按成交量排序
        allStocks.sort((a, b) => b.volume - a.volume);

        res.status(200).json({ 
            success: true, 
            data: allStocks, 
            count: allStocks.length, 
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
        const timeout = setTimeout(() => reject(new Error('timeout')), 5000);
        https.get(url, (resp) => {
            let data = '';
            resp.on('data', chunk => data += chunk);
            resp.on('end', () => {
                clearTimeout(timeout);
                try { resolve(JSON.parse(data)); }
                catch (e) { reject(e); }
            });
        }).on('error', (e) => {
            clearTimeout(timeout);
            reject(e);
        });
    });
}

function getIndustry(code) {
    const ind = {
        '600036':'finance','601318':'finance','600000':'finance','601398':'finance','601988':'finance',
        '601166':'finance','000001':'finance','600030':'finance','601688':'finance','601601':'finance',
        '600519':'consumer','000858':'consumer','000333':'consumer','000651':'consumer','600887':'consumer',
        '000568':'consumer','002304':'consumer','603288':'consumer','600809':'consumer','000895':'consumer',
        '300750':'tech','002594':'tech','002415':'tech','000725':'tech','300059':'tech',
        '002230':'tech','300760':'tech','002475':'tech','000063':'tech','600588':'tech',
        '600276':'healthcare','000538':'healthcare','002007':'healthcare','600196':'healthcare',
        '600900':'energy','601012':'energy','600011':'energy','601985':'energy','600886':'energy',
        '600309':'material','601899':'material','600585':'material','000423':'material',
        '600031':'industrial','000002':'industrial','601668':'industrial','601390':'industrial'
    };
    return ind[code] || 'other';
}
