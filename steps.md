1. setup database
2. setup with auth endpoints to signup, signin, and me endpoint
   u can logout from /me endpoint

- **Endpoints (REST first)**:
  1. `POST /auth/signup` – Create a new user.
  2. `POST /auth/signin` – Login.
  3. `GET /auth/me` – Get current logged-in user.

so like we implement all this 1st in rest, then slowly we will migrate it to websockets in fe so that updates are in real time??

3.  next step is to implement underlying and contract option
    - What assets exist
      `GET /underlyings`

      ```json
      [
        { "id": "uid1", "symbol": "AAPL" },
        { "id": "uid2", "symbol": "TSLA" }
      ]
      ```

    - What option contracts exist for each asset
      `GET /contracts?symbol=AAPL`
      ```json
      [
        {
          "id": "contract1",
          "optionType": "CALL",
          "strike": 20000,
          "expiry": "2025-01-25T00:00:00Z"
        },
        {
          "id": "contract2",
          "optionType": "PUT",
          "strike": 20000,
          "expiry": "2025-01-25T00:00:00Z"
        }
      ]
      ```

4.  market data & pricing;Real-time price updates for underlyings and option contracts
    - `POST /underlyings/:id/price` - Update underlying price (admin/system)
    - `GET /prices` - Get current prices for all underlyings
    - `GET /chain/:underlyingId` - Get option chain (all calls + puts for an underlying with optional expiry filter)

5.  Orders & Matching Engine
    - `POST /orders` – Place order (MARKET/LIMIT, BUY/SELL)
    - `GET /orders` – List user orders
    - `GET /orders/:id` – Single order detail
    - `DELETE /orders/:id` – Cancel open order

6.  Real Time Updates
    - `orders:${user.id}` – personal order updates
    - `orderbook:${contractId}` – contract-level orderbook updates
    - `trades:${contractId}` – global trades for charting

---

**Next step**:

- **FE** : Display underlyings + option chains, allow selecting contracts for orders.
  Place and list orders
  Optional filter: expiry date
  Returns all CALLs + PUTs for the underlying
  Subscribe to WebSockets for real-time price updates

- **WebSocket integration** : Order updates + Orderbook updates + Trade feed / charting + Portfolio/positions updates

- **Market data feed**: Update underlying prices + Fetch option chains + Real-time pricing on FE

---

we are implementing sockets for a single reason: restapi is ineeficient as it's polling is slow, wasteful; changes are so quick
websockets are used: real-time orderbook, charts update, position, efficiency over rest

fe->socket->be
be authenticates user

fe subscribes to channels
orders:{userId} → personal order updates
orderbook:{contractId} → contract-level updates
trades:{contractId} → global trade feed

when be changes state-> push to ws -> push to fe
