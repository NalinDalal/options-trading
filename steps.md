1. setup database
2. setup with auth endpoints to signup, signin, and me endpoint
   u can logout from /me endpoint

so like we implement all this 1st in rest, then slowly we will migrate it to websockets in fe so that updates are in real time??

3. next step is to implement underlying and contract option
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
