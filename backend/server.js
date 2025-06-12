const express = require('express');
const cors = require('cors');
const axios = require('axios');
const technicalIndicators = require('technicalindicators');
const WebSocket = require('ws');

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());

app.get('/analyze', async (req, res) => {
  const symbol = req.query.symbol || 'BTCUSDT';
  const interval = req.query.interval || '1h';

  try {
    const response = await axios.get('https://api.binance.com/api/v3/klines', {
      params: { symbol, interval, limit: 50 }
    });

    const prices = response.data.map(c => parseFloat(c[4]));
    const closes = [...prices];

    const ma = technicalIndicators.SMA.calculate({ period: 14, values: closes });
    const rsi = technicalIndicators.RSI.calculate({ period: 14, values: closes });

    const trend = closes[closes.length - 1] > ma[ma.length - 1] ? 'Bullish' : 'Bearish';

    const analysis = {
      trend,
      openPrice: closes[closes.length - 1],
      takeProfit: closes[closes.length - 1] * 1.03,
      stopLoss: closes[closes.length - 1] * 0.97,
      explanation: `MA: ${ma[ma.length - 1].toFixed(2)}, RSI: ${rsi[rsi.length - 1].toFixed(2)}`,
      history: closes.slice(-5).map((price, index) => ({
        time: `${index + 1}h ago`,
        price
      }))
    };

    res.json(analysis);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Analysis failed' });
  }
});

const server = app.listen(port, () => {
  console.log(`HTTP server listening on port ${port}`);
});

const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  console.log('WebSocket connected');

  ws.on('message', (msg) => {
    try {
      const { symbol } = JSON.parse(msg);
      const binanceWs = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@trade`);

      binanceWs.on('message', (data) => {
        const trade = JSON.parse(data);
        ws.send(JSON.stringify({ price: parseFloat(trade.p) }));
      });

      ws.on('close', () => binanceWs.close());
    } catch (err) {
      console.error('WebSocket error:', err);
    }
  });
});
