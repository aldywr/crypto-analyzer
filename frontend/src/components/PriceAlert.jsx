import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

toast.configure();

export default function PriceAlert({ symbol, takeProfit, stopLoss }) {
  const [livePrice, setLivePrice] = useState(null);
  const wsRef = useRef(null);
  const alertedRef = useRef({ tp: false, sl: false });

  useEffect(() => {
    if (!symbol) return;
    if (wsRef.current) wsRef.current.close();

    const ws = new WebSocket('ws://localhost:3002');
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ symbol: `${symbol}USDT` }));
    };

    ws.onmessage = (msg) => {
      const { price } = JSON.parse(msg.data);
      setLivePrice(price);

      if (!alertedRef.current.tp && price >= takeProfit) {
        toast.success(`🎯 Price hit TP: $${price}`);
        alertedRef.current.tp = true;
      }
      if (!alertedRef.current.sl && price <= stopLoss) {
        toast.error(`🚨 Price hit SL: $${price}`);
        alertedRef.current.sl = true;
      }
    };

    return () => ws.close();
  }, [symbol, takeProfit, stopLoss]);

  return (
    <div className="text-green-600 font-semibold text-xl mt-2">
      Live Price: ${livePrice ? livePrice.toFixed(2) : 'Loading...'}
    </div>
  );
}
