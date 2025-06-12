import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectItem } from './ui/select';
import { Card, CardContent } from './ui/card';
import { toast } from 'react-toastify';
import { createChart } from 'lightweight-charts';
import 'react-toastify/dist/ReactToastify.css';

toast.configure();

export default function CryptoDashboard() {
  const [selectedAsset, setSelectedAsset] = useState('BTC');
  const [timeframe, setTimeframe] = useState('1h');
  const [analysis, setAnalysis] = useState(null);
  const [livePrice, setLivePrice] = useState(null);
  const chartRef = useRef();
  const chartContainerRef = useRef();
  const candleSeriesRef = useRef();
  const wsRef = useRef(null);
  const alertedRef = useRef({ tp: false, sl: false });

  const fetchAnalysis = async () => {
    try {
      const res = await fetch(
        `http://localhost:3001/analyze?symbol=${selectedAsset}USDT&interval=${timeframe}`
      );
      const data = await res.json();
      setAnalysis(data);
      alertedRef.current = { tp: false, sl: false };
    } catch (err) {
      toast.error('Failed to fetch analysis');
    }
  };

  const setupWebSocket = () => {
    if (wsRef.current) wsRef.current.close();
    const ws = new WebSocket('ws://localhost:3002');
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ symbol: `${selectedAsset}USDT` }));
    };

    ws.onmessage = (msg) => {
      const { price } = JSON.parse(msg.data);
      setLivePrice(price);

      if (analysis) {
        if (!alertedRef.current.tp && price >= analysis.takeProfit) {
          toast.success(`🎯 TP hit: $${price}`);
          alertedRef.current.tp = true;
        }
        if (!alertedRef.current.sl && price <= analysis.stopLoss) {
          toast.error(`🚨 SL hit: $${price}`);
          alertedRef.current.sl = true;
        }
      }
    };
  };

  const fetchCandles = async () => {
    const intervalMap = { '1h': '1h', '4h': '4h', '1d': '1d' };
    const binanceInterval = intervalMap[timeframe] || '1h';
    const res = await fetch(
      `https://api.binance.com/api/v3/klines?symbol=${selectedAsset}USDT&interval=${binanceInterval}&limit=100`
    );
    const data = await res.json();
    const candles = data.map(candle => ({
      time: candle[0] / 1000,
      open: parseFloat(candle[1]),
      high: parseFloat(candle[2]),
      low: parseFloat(candle[3]),
      close: parseFloat(candle[4]),
    }));
    candleSeriesRef.current.setData(candles);
  };

  useEffect(() => {
    setupWebSocket();
    return () => wsRef.current?.close();
  }, [selectedAsset]);

  useEffect(() => {
    chartRef.current = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 400,
      layout: { backgroundColor: '#fff', textColor: '#000' },
      grid: { vertLines: { color: '#eee' }, horzLines: { color: '#eee' } },
      timeScale: { timeVisible: true, secondsVisible: false },
    });
    candleSeriesRef.current = chartRef.current.addCandlestickSeries();
    fetchCandles();
    return () => chartRef.current.remove();
  }, [selectedAsset, timeframe]);

  return (
    <main className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">📊 Crypto Analyzer Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <Select value={selectedAsset} onValueChange={setSelectedAsset}>
          <SelectItem value="BTC">Bitcoin (BTC)</SelectItem>
          <SelectItem value="ETH">Ethereum (ETH)</SelectItem>
          <SelectItem value="BNB">Binance Coin (BNB)</SelectItem>
        </Select>
        <Select value={timeframe} onValueChange={setTimeframe}>
          <SelectItem value="1h">1 Hour</SelectItem>
          <SelectItem value="4h">4 Hours</SelectItem>
          <SelectItem value="1d">1 Day</SelectItem>
        </Select>
        <Button onClick={fetchAnalysis}>🔍 Analyze</Button>
      </div>

      {livePrice && (
        <div className="text-green-600 font-semibold text-xl mb-2">
          Live Price: ${livePrice.toFixed(2)}
        </div>
      )}

      <div ref={chartContainerRef} className="w-full mb-6 rounded shadow-md" />

      {analysis && (
        <Card>
          <CardContent className="space-y-2 py-4">
            <div><strong>Trend:</strong> {analysis.trend}</div>
            <div><strong>Open Price:</strong> ${parseFloat(analysis.openPrice).toFixed(2)}</div>
            <div><strong>TP:</strong> ${parseFloat(analysis.takeProfit).toFixed(2)} | <strong>SL:</strong> ${parseFloat(analysis.stopLoss).toFixed(2)}</div>
            <div><strong>Timeframe:</strong> {timeframe}</div>
            <div className="text-gray-600 text-sm">{analysis.explanation}</div>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
