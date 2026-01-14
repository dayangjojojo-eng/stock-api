// Vercel Serverless Function - 股票数据API
// 由于新浪API有跨域限制，这里直接返回本地数据

// 股票基础信息
const stockInfo = {
    'sh600000': { name: '浦发银行', pe: 6.8, pb: 0.65, roe: 9.5, industry: 'finance', basePrice: 8.45 },
    'sz000858': { name: '五粮液', pe: 28.5, pb: 8.2, roe: 28.8, industry: 'consumer', basePrice: 142.50 },
    'sh600519': { name: '贵州茅台', pe: 32.1, pb: 15.8, roe: 49.2, industry: 'consumer', basePrice: 1856.00 },
    'sz000333': { name: '美的集团', pe: 15.2, pb: 3.5, roe: 23.1, industry: 'consumer', basePrice: 32.80 },
    'sh600036': { name: '招商银行', pe: 7.5, pb: 0.95, roe: 12.6, industry: 'finance', basePrice: 28.95 },
    'sz000651': { name: '格力电器', pe: 12.3, pb: 2.8, roe: 22.8, industry: 'consumer', basePrice: 28.50 },
    'sh601398': { name: '工商银行', pe: 5.9, pb: 0.58, roe: 9.8, industry: 'finance', basePrice: 5.28 },
    'sz300750': { name: '宁德时代', pe: 45.6, pb: 8.2, roe: 18.2, industry: 'tech', basePrice: 185.30 },
    'sh600900': { name: '长江电力', pe: 11.2, pb: 1.2, roe: 10.8, industry: 'energy', basePrice: 18.65 },
    'sh601988': { name: '中国银行', pe: 5.2, pb: 0.48, roe: 9.2, industry: 'finance', basePrice: 3.15 },
    'sh600588': { name: '用友网络', pe: 38.9, pb: 5.2, roe: 13.4, industry: 'tech', basePrice: 32.10 },
    'sz000001': { name: '平安银行', pe: 5.8, pb: 0.62, roe: 10.5, industry: 'finance', basePrice: 10.25 },
    'sh600276': { name: '恒瑞医药', pe: 52.3, pb: 6.8, roe: 13.2, industry: 'healthcare', basePrice: 45.80 },
    'sz000002': { name: '万科A', pe: 8.5, pb: 0.85, roe: 10.2, industry: 'industrial', basePrice: 12.35 },
    'sh601318': { name: '中国平安', pe: 8.2, pb: 1.1, roe: 13.5, industry: 'finance', basePrice: 42.50 },
    'sz002415': { name: '海康威视', pe: 22.5, pb: 4.5, roe: 20.1, industry: 'tech', basePrice: 35.20 },
    'sh600887': { name: '伊利股份', pe: 18.5, pb: 4.2, roe: 22.8, industry: 'consumer', basePrice: 28.90 },
    'sz000568': { name: '泸州老窖', pe: 25.6, pb: 7.5, roe: 29.3, industry: 'consumer', basePrice: 168.50 },
    'sh601012': { name: '隆基绿能', pe: 15.8, pb: 2.8, roe: 17.8, industry: 'energy', basePrice: 25.80 },
    'sz002594': { name: '比亚迪', pe: 35.2, pb: 5.8, roe: 16.5, industry: 'tech', basePrice: 245.00 },
    'sh600309': { name: '万华化学', pe: 12.8, pb: 3.2, roe: 25.1, industry: 'material', basePrice: 85.60 },
    'sz002304': { name: '洋河股份', pe: 22.3, pb: 5.5, roe: 24.6, industry: 'consumer', basePrice: 125.80 },
    'sh601899': { name: '紫金矿业', pe: 15.2, pb: 3.8, roe: 25.2, industry: 'material', basePrice: 12.85 },
    'sh600031': { name: '三一重工', pe: 10.5, pb: 1.8, roe: 17.2, industry: 'industrial', basePrice: 18.50 },
    'sz002475': { name: '立讯精密', pe: 28.5, pb: 5.2, roe: 18.3, industry: 'tech', basePrice: 32.50 },
    'sh600030': { name: '中信证券', pe: 18.5, pb: 1.5, roe: 8.2, industry: 'finance', basePrice: 22.80 },
    'sz000725': { name: '京东方A', pe: 25.8, pb: 1.2, roe: 4.8, industry: 'tech', basePrice: 4.25 },
    'sh601166': { name: '兴业银行', pe: 5.5, pb: 0.55, roe: 10.1, industry: 'finance', basePrice: 16.50 },
    'sz000063': { name: '中兴通讯', pe: 22.5, pb: 2.8, roe: 12.5, industry: 'tech', basePrice: 28.90 },
    'sz002352': { name: '顺丰控股', pe: 32.5, pb: 3.5, roe: 10.8, industry: 'industrial', basePrice: 42.50 }
};

module.exports = (req, res) => {
    // 设置CORS头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // 生成带随机波动的股票数据
    const stocks = Object.entries(stockInfo).map(([fullCode, info]) => {
        // 随机波动 -3% 到 +3%
        const fluctuation = (Math.random() - 0.5) * 0.06;
        const price = +(info.basePrice * (1 + fluctuation)).toFixed(2);
        const change = +((Math.random() - 0.5) * 6).toFixed(2);
        
        return {
            code: fullCode.replace(/^(sh|sz)/, ''),
            fullCode: fullCode,
            name: info.name,
            price: price,
            change: change,
            pe: info.pe,
            pb: info.pb,
            roe: info.roe,
            industry: info.industry
        };
    });

    res.status(200).json({
        success: true,
        data: stocks,
        timestamp: new Date().toISOString(),
        count: stocks.length
    });
};
