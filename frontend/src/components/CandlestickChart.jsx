import React, { useEffect, useRef } from 'react';
import { createChart } from 'lightweight-charts';

export default function CandlestickChart({ symbol = 'BTCUSDT', interval = '1h' }) {
  const chartContainerRef = useRef();
  const chartRef = useRef();
  const candleSeriesRef = useRef();

  useEffect(() => {
    const fetchCandles = async () => {
      const res = await fetch(
        `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=100`
      );
      const data = await res.json();

      const candlestickData = data.map(candle => ({
        time: candle[0] / 1000,
        open: parseFloat(candle[1]),
        high: parseFloat(candle[2]),
        low: parseFloat(candle[3]),
        close: parseFloat(candle[4]),
      }));

      candleSeriesRef.current.setData(candlestickData);
    };

    chartRef.current = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 400,
      layout: {
        backgroundColor: '#ffffff',
        textColor: '#000',
      },
      grid: {
        vertLines: { color: '#eee' },
        horzLines: { color: '#eee' },
      },
      timeScale: { timeVisible: true, secondsVisible: false },
    });

    candleSeriesRef.current = chartRef.current.addCandlestickSeries();
    fetchCandles();

    return () => chartRef.current.remove();
  }, [symbol, interval]);

  return <div ref={chartContainerRef} className="w-full mt-4 rounded shadow-md" />;
}
