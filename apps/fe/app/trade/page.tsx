"use client";
import { useEffect, useState, useMemo, useRef } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8080";

type Underlying = { id: string; symbol: string };
type Contract = {
  id: string;
  underlyingId: string;
  optionType: "CALL" | "PUT";
  strike: string | number;
  expiry: string;
};

type OrderbookEntry = {
  id: string;
  side: "BUY" | "SELL";
  price: string | number | null;
  qty: number;
  remainingQty: number;
  orderType: "LIMIT" | "MARKET";
  createdAt: string;
};

type Position = {
  id: string;
  contractId: string;
  side: "BUY" | "SELL";
  qty: number;
  avgPrice: string | number;
  realizedPnl: string | number;
  contract: {
    id: string;
    optionType: string;
    strike: string | number;
    expiry: string;
    underlying: { id: string; symbol: string };
  };
};

type Trade = {
  id: string;
  price: string | number;
  qty: number;
  direction: "BUY" | "SELL";
  timestamp: string;
  order: {
    id: string;
    contractId: string;
    contract: {
      id: string;
      optionType: string;
      strike: string | number;
      expiry: string;
      underlying: { id: string; symbol: string };
    };
  };
};

type PriceUpdate = { symbol: string; price: number };

type Order = {
  id: string;
  contractId: string;
  side: "BUY" | "SELL";
  status: string;
  qty: number;
  filledQty: number;
};

const formatMoney = /**
 * Executes format money operation.
 * @param {string | number} value - Description of value
 * @returns {string} Description of return value
 */
(value: string | number | null | undefined) => {
  if (value === null || value === undefined) return "-";
  const num = Number(value);
  if (Number.isNaN(num)) return String(value);
  return num.toFixed(2);
};

const utcDate = /**
 * Executes utc date operation.
 * @param {string} value - Description of value
 * @returns {string} Description of return value
 */
(value: string) => new Date(value).toUTCString();

/**
 * Performs  trade page operation.
 * @returns {React.JSX.Element} Description of return value
 */
export default function TradePage() {
  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [underlyings, setUnderlyings] = useState<Underlying[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [selectedUnderlying, setSelectedUnderlying] = useState<string | null>(
    null,
  );
  const [selectedContract, setSelectedContract] = useState<string | null>(null);
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [orderbook, setOrderbook] = useState<{
    bids: OrderbookEntry[];
    asks: OrderbookEntry[];
  }>({ bids: [], asks: [] });
  const [positions, setPositions] = useState<Position[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [status, setStatus] = useState<string>("Loading...");
  const [placing, setPlacing] = useState(false);
  const [form, setForm] = useState({
    side: "BUY" as "BUY" | "SELL",
    qty: 1,
    price: "",
  });
  const wsRef = useRef<WebSocket | null>(null);

  const contractLookup = useMemo(() => {
    const map: Record<string, Contract> = {};
    contracts.forEach((c) => {
      map[c.id] = c;
    });
    return map;
  }, [contracts]);

  const underlyingById = useMemo(() => {
    const map: Record<string, string> = {};
    underlyings.forEach((u) => {
      map[u.id] = u.symbol;
    });
    return map;
  }, [underlyings]);

  // bootstrap auth and basic data
  useEffect(() => {
    const t = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!t) {
      setStatus("Not authenticated — sign in first.");
      return;
    }
    setToken(t);

    (async () => {
      try {
        const me = await fetch(`${API_URL}/me`, {
          headers: { Authorization: `Bearer ${t}` },
        }).then((r) => r.json());
        if (!me?.user?.id) throw new Error("Invalid token");
        setUserId(me.user.id);

        const [uRes, priceRes] = await Promise.all([
          fetch(`${API_URL}/underlyings`).then((r) => r.json()),
          fetch(`${API_URL}/prices`).then((r) => r.json()),
        ]);

        setUnderlyings(uRes.underlyings || []);
        const priceMap: Record<string, number> = {};
        (priceRes.prices || []).forEach((p: any) => {
          if (p.symbol && p.currentPrice !== undefined) {
            const val = Number(p.currentPrice);
            priceMap[p.symbol] = val;
            priceMap[p.id] = val;
          }
        });
        setPrices(priceMap);
        setStatus("Connected");
      } catch (err: any) {
        setStatus(err.message || "Failed to load user");
      }
    })();
  }, []);

  // load contracts when underlying selected
  useEffect(() => {
    if (!selectedUnderlying) return;
    fetch(`${API_URL}/contracts?underlyingId=${selectedUnderlying}`)
      .then((r) => r.json())
      .then((data) => setContracts(data.contracts || []))
      .catch(() => {});
  }, [selectedUnderlying]);

  // load orderbook/trades when contract selected
  useEffect(() => {
    if (!selectedContract || !token) return;
    fetch(`${API_URL}/orderbook/${selectedContract}`)
      .then((r) => r.json())
      .then((data) => {
        setOrderbook({ bids: data.bids || [], asks: data.asks || [] });
      })
      .catch(() => {});

    fetch(`${API_URL}/trades?contractId=${selectedContract}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => setTrades(data.trades || []))
      .catch(() => {});
  }, [selectedContract, token]);

  // load positions and orders
  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/positions`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => setPositions(data.positions || []))
      .catch(() => {});

    fetch(`${API_URL}/orders`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => setOrders(data.orders || []))
      .catch(() => {});
  }, [token]);

  // websocket wiring
  useEffect(() => {
    if (!token || !userId) return;
    const ws = new WebSocket(`${WS_URL}?token=${token}`);
    wsRef.current = ws;

    ws.onopen = () => {
      const channels = ["prices", `orders:${userId}`, `positions:${userId}`];
      if (selectedContract) {
        channels.push(`orderbook:${selectedContract}`);
        channels.push(`trades:${selectedContract}`);
      }
      ws.send(JSON.stringify({ type: "subscribe", channels }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "price_update" && data.symbol) {
          setPrices((prev) => ({ ...prev, [data.symbol]: Number(data.price) }));
        }
        if (data.type === "order_update" && data.order) {
          setOrders((prev) => {
            const other = prev.filter((o) => o.id !== data.order.id);
            return [data.order, ...other].slice(0, 50);
          });
        }
        if (data.type === "orderbook_update" && data.order) {
          // Simple refetch for consistency
          if (selectedContract) {
            fetch(`${API_URL}/orderbook/${selectedContract}`)
              .then((r) => r.json())
              .then((ob) =>
                setOrderbook({ bids: ob.bids || [], asks: ob.asks || [] }),
              )
              .catch(() => {});
          }
        }
        if (data.type === "trade" && data.trade) {
          setTrades((prev) => [data.trade, ...prev].slice(0, 50));
        }
        if (data.type === "position_update" && data.position) {
          setPositions((prev) => {
            const others = prev.filter((p) => p.id !== data.position.id);
            return [data.position, ...others];
          });
        }
      } catch {
        // ignore bad payloads
      }
    };

    return () => {
      ws.close();
    };
  }, [token, userId, selectedContract]);

  const placeOrder = async () => {
    if (!token || !selectedContract) return;
    setPlacing(true);
    try {
      const body: any = {
        contractId: selectedContract,
        side: form.side,
        qty: Number(form.qty),
      };
      if (form.price) body.price = Number(form.price);

      const res = await fetch(`${API_URL}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Order failed");
      }
    } catch (err: any) {
      alert(err.message || "Order failed");
    } finally {
      setPlacing(false);
    }
  };

  const selectedContractObj = selectedContract
    ? contractLookup[selectedContract]
    : null;

  return (
    <div className="min-h-screen bg-slate-950 text-white px-6 py-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-sm text-slate-400">Trading</div>
            <h1 className="text-2xl font-bold">Options Desk</h1>
          </div>
          <div className="text-sm text-slate-400">{status}</div>
        </header>

        <section className="grid md:grid-cols-3 gap-4">
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="text-sm text-slate-400">Underlying</div>
            <select
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2"
              value={selectedUnderlying ?? ""}
              onChange={(e) => {
                setSelectedUnderlying(e.target.value || null);
                setSelectedContract(null);
              }}
            >
              <option value="">Select underlying</option>
              {underlyings.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.symbol}
                </option>
              ))}
            </select>

            <div className="text-sm text-slate-400">Contract</div>
            <select
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2"
              value={selectedContract ?? ""}
              onChange={(e) => setSelectedContract(e.target.value || null)}
              disabled={!selectedUnderlying}
            >
              <option value="">Select contract</option>
              {contracts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.optionType} {c.strike} exp {c.expiry.slice(0, 10)}
                </option>
              ))}
            </select>

            <div className="text-sm text-slate-400">
              {(() => {
                if (!selectedContractObj) return "Last price: -";
                const sym = underlyingById[selectedContractObj.underlyingId];
                const val = sym
                  ? (prices[sym] ?? prices[selectedContractObj.underlyingId])
                  : undefined;
                return `Last price: ${val !== undefined ? formatMoney(val) : "-"}`;
              })()}
            </div>
          </div>

          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-400">Order</div>
              <div className="text-xs text-slate-500">
                Limit price optional → market
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                className={`px-3 py-2 rounded-lg border ${form.side === "BUY" ? "border-green-500 bg-green-500/10" : "border-slate-700 bg-slate-800"}`}
                onClick={() => setForm((f) => ({ ...f, side: "BUY" }))}
              >
                Buy
              </button>
              <button
                className={`px-3 py-2 rounded-lg border ${form.side === "SELL" ? "border-red-500 bg-red-500/10" : "border-slate-700 bg-slate-800"}`}
                onClick={() => setForm((f) => ({ ...f, side: "SELL" }))}
              >
                Sell
              </button>
            </div>
            <input
              type="number"
              min={1}
              value={form.qty}
              onChange={(e) =>
                setForm((f) => ({ ...f, qty: Number(e.target.value) }))
              }
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2"
              placeholder="Quantity"
            />
            <input
              type="number"
              value={form.price}
              onChange={(e) =>
                setForm((f) => ({ ...f, price: e.target.value }))
              }
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2"
              placeholder="Limit price (optional)"
            />
            <button
              disabled={!selectedContract || placing}
              onClick={placeOrder}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 px-3 py-2 rounded-lg font-semibold"
            >
              {placing ? "Placing..." : "Place order"}
            </button>
          </div>

          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="text-sm text-slate-400">Positions</div>
            <div className="space-y-2 max-h-64 overflow-auto text-sm">
              {positions.length === 0 && (
                <div className="text-slate-500">None</div>
              )}
              {positions.map((p) => (
                <div
                  key={p.id}
                  className="border border-slate-800 rounded-lg px-3 py-2"
                >
                  <div className="flex justify-between">
                    <span>
                      {p.contract.underlying.symbol} {p.contract.optionType}
                    </span>
                    <span
                      className={
                        p.side === "BUY" ? "text-green-400" : "text-red-400"
                      }
                    >
                      {p.side}
                    </span>
                  </div>
                  <div className="text-slate-400 text-xs">
                    Qty {p.qty} @ {formatMoney(p.avgPrice)}
                  </div>
                  <div className="text-slate-400 text-xs">
                    Realized PnL {formatMoney(p.realizedPnl)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid md:grid-cols-2 gap-4">
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-slate-400">Orderbook</div>
              <div className="text-xs text-slate-500">Live via WS</div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-xs text-slate-500 mb-1">Bids</div>
                <div className="space-y-1 max-h-64 overflow-auto">
                  {orderbook.bids.map((b) => (
                    <div
                      key={b.id}
                      className="flex justify-between text-green-300"
                    >
                      <span>{formatMoney(b.price)}</span>
                      <span>{b.remainingQty}</span>
                    </div>
                  ))}
                  {orderbook.bids.length === 0 && (
                    <div className="text-slate-600">No bids</div>
                  )}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">Asks</div>
                <div className="space-y-1 max-h-64 overflow-auto">
                  {orderbook.asks.map((a) => (
                    <div
                      key={a.id}
                      className="flex justify-between text-red-300"
                    >
                      <span>{formatMoney(a.price)}</span>
                      <span>{a.remainingQty}</span>
                    </div>
                  ))}
                  {orderbook.asks.length === 0 && (
                    <div className="text-slate-600">No asks</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-slate-400">Recent trades</div>
              <div className="text-xs text-slate-500">Live via WS</div>
            </div>
            <div className="space-y-1 max-h-64 overflow-auto text-sm">
              {trades.length === 0 && (
                <div className="text-slate-600">No trades</div>
              )}
              {trades.map((t) => (
                <div
                  key={t.id}
                  className="flex justify-between border border-slate-800 rounded-lg px-3 py-2"
                >
                  <span
                    className={
                      t.direction === "BUY" ? "text-green-400" : "text-red-400"
                    }
                  >
                    {t.direction}
                  </span>
                  <span>{formatMoney(t.price)}</span>
                  <span>qty {t.qty}</span>
                  <span className="text-slate-500">{utcDate(t.timestamp)}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-slate-900/70 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-slate-400">My orders</div>
            <div className="text-xs text-slate-500">Live via WS</div>
          </div>
          <div className="grid grid-cols-5 text-sm text-slate-400 mb-1">
            <span>ID</span>
            <span>Side</span>
            <span>Status</span>
            <span>Qty</span>
            <span>Filled</span>
          </div>
          <div className="space-y-1 max-h-72 overflow-auto text-sm">
            {orders.length === 0 && (
              <div className="text-slate-600">No orders</div>
            )}
            {orders.map((o) => (
              <div
                key={o.id}
                className="grid grid-cols-5 items-center border border-slate-800 rounded-lg px-3 py-2"
              >
                <span className="truncate">{o.id.slice(0, 6)}...</span>
                <span
                  className={
                    o.side === "BUY" ? "text-green-400" : "text-red-400"
                  }
                >
                  {o.side}
                </span>
                <span>{o.status}</span>
                <span>{o.qty}</span>
                <span>{o.filledQty}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
