const http = require('http');

// 50只热门A股
const HOT_STOCKS = [
    'sh600519','sz000858','sz300750','sz002594','sz000333','sz000651','sh600036','sh601318',
    'sz000725','sz002415','sh600000','sh601398','sh601988','sh600030','sz000001','sh600276',
    'sh600887','sz000568','sz002304','sh600900','sh601012','sh600309','sh601899','sh600031',
    'sz002475','sh601166','sz000063','sz002352','sh603288','sh600809','sz300059','sz002230',
    'sz000538','sh600196','sh601668','sh601390','sh600048','sh600011','sh601985','sh600585',
    'sz000423','sz002460','sh600219','sh601100','sz000630','sz002466','sh600426','sh601688',
    'sh601601','sh601328'
];

// 股票名称映射
const STOCK_NAMES = {
    '600519':'贵州茅台','000858':'五粮液','300750':'宁德时代','002594':'比亚迪',
    '000333':'美的集团','000651':'格力电器','600036':'招商银行','601318':'中国平安',
    '000725':'京东方A','002415':'海康威视','600000':'浦发银行','601398':'工商银行',
    '601988':'中国银行','600030':'中信证券','000001':'平安银行','600276':'恒瑞医药',
    '600887':'伊利股份','000568':'泸州老窖','002304':'洋河股份','600900':'长江电力',
    '601012':'隆基绿能','600309':'万华化学','601899':'紫金矿业','600031':'三一重工',
    '002475':'立讯精密','601166':'兴业银行','000063':'中兴通讯','002352':'顺丰控股',
    '603288':'海天味业','600809':'山西汾酒','300059':'东方财富','002230':'科大讯飞',
    '000538':'云南白药','600196':'复星医药','601668':'中国建筑','601390':'中国中铁',
    '600048':'保利发展','600011':'华能国际','601985':'中国核电','600585':'海螺水泥',
    '000423':'东阿阿胶','002460':'赣锋锂业','600219':'南山铝业','601100':'恒立液压',
    '000630':'铜陵有色','002466':'天齐锂业','600426':'华鲁恒升','601688':'华泰证券',
    '601601':'中国太保','601328':'交通银行'
};

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        const codes = HOT_STOCKS.join(',');
        const data = await fetchSinaData(codes);
        
        const stocks = [];
        for (const code of HOT_STOCKS) {
            const info = data[code];
            if (info && info.price > 0) {
                const shortCode = code.substring(2);
                stocks.push({
                    code: shortCode,
                    name: STOCK_NAMES[shortCode] || shortCode,
                    price: info.price,
                    change: info.change,
                    pe: 0,
                    pb: 0,
                    roe: 0,
                    volume: info.volume,
                    amount: info.amount,
                    high: info.high,
                    low: info.low,
                    open: info.open,
                    industry: getIndustry(shortCode)
                });
            }
        }

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

function fetchSinaData(codes) {
    return new Promise((resolve, reject) => {
        const url = `http://hq.sinajs.cn/list=${codes}`;
        http.get(url, {
            headers: { 'Referer': 'http://finance.sina.com.cn' }
        }, (resp) => {
            const chunks = [];
            resp.on('data', chunk => chunks.push(chunk));
            resp.on('end', () => {
                try {
                    const buffer = Buffer.concat(chunks);
                    const data = buffer.toString('utf-8');
                    const result = {};
                    const lines = data.split('\n');
                    for (const line of lines) {
                        if (!line.includes('=')) continue;
                        const match = line.match(/hq_str_(\w+)="(.*)"/);
                        if (match) {
                            const code = match[1];
                            const values = match[2].split(',');
                            if (values.length > 30) {
                                const yclose = parseFloat(values[2]) || 0;
                                const price = parseFloat(values[3]) || 0;
                                result[code] = {
                                    open: parseFloat(values[1]) || 0,
                                    price: price,
                                    high: parseFloat(values[4]) || 0,
                                    low: parseFloat(values[5]) || 0,
                                    volume: parseFloat(values[8]) || 0,
                                    amount: parseFloat(values[9]) || 0,
                                    change: yclose > 0 ? ((price - yclose) / yclose * 100).toFixed(2) : 0
                                };
                            }
                        }
                    }
                    resolve(result);
                } catch (e) { reject(e); }
            });
        }).on('error', reject);
    });
}

function getIndustry(code) {
    const ind = {
        '600036':'finance','601318':'finance','600000':'finance','601398':'finance','601988':'finance',
        '601166':'finance','000001':'finance','600030':'finance','601688':'finance','601601':'finance','601328':'finance',
        '600519':'consumer','000858':'consumer','000333':'consumer','000651':'consumer','600887':'consumer',
        '000568':'consumer','002304':'consumer','603288':'consumer','600809':'consumer',
        '300750':'tech','002594':'tech','002415':'tech','000725':'tech','300059':'tech','002230':'tech','002475':'tech','000063':'tech',
        '600276':'healthcare','000538':'healthcare','600196':'healthcare',
        '600900':'energy','601012':'energy','600011':'energy','601985':'energy',
        '600309':'material','601899':'material','600585':'material','000423':'material','002460':'material','002466':'material','000630':'material','600219':'material','600426':'material',
        '600031':'industrial','601668':'industrial','601390':'industrial','600048':'industrial','002352':'industrial','601100':'industrial'
    };
    return ind[code] || 'other';
}
