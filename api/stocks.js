const http = require('http');
const https = require('https');

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

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        // 使用新浪财经API获取实时数据
        const codes = HOT_STOCKS.join(',');
        const data = await fetchSinaData(codes);
        
        const stocks = [];
        for (const code of HOT_STOCKS) {
            const info = data[code];
            if (info && info.price > 0) {
                stocks.push({
                    code: code.substring(2),
                    name: info.name,
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
                    industry: 'other'
                });
            }
        }

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

function fetchSinaData(codes) {
    return new Promise((resolve, reject) => {
        const url = `http://hq.sinajs.cn/list=${codes}`;
        http.get(url, {
            headers: {
                'Referer': 'http://finance.sina.com.cn',
                'User-Agent': 'Mozilla/5.0'
            }
        }, (resp) => {
            let data = '';
            resp.on('data', chunk => data += chunk);
            resp.on('end', () => {
                try {
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
                                    name: values[0],
                                    open: parseFloat(values[1]) || 0,
                                    yclose: yclose,
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
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', reject);
    });
}
