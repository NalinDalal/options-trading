# Option trading platform

users can trade options (CALL/PUT) on various underlying assets (BTC/ETH/NIFTY/etc.).

```mermaid
flowchart TB

%% ===========================
%%  UI / CLIENT LAYER
%% ===========================
subgraph CLIENT["Client "]
    C1[Login / Signup]
    C2[Place Orders]
    C3[View Positions]
    C4[Charts & Market Data]
end

%% ===========================
%%  API LAYER
%% ===========================
subgraph API["Backend API "]
    A1[Auth Service]
    A2[Order Service]
    A3[User Balance Service]
    A4[Position Service]
    A5[Contract Service]
    A6[Trade Service]
end

%% ===========================
%%  TRADING ENGINE
%% ===========================
subgraph ENGINE["Trading Engine Cluster"]
    E1[Matching Engine - Order Book]
    E2[Risk Engine - Margin Checks]
    E3[PnL Engine - Mark to Market]
    E4[Expiry Engine - Contract Settlement]
end

%% ===========================
%%  MARKET DATA
%% ===========================
subgraph MD["Market Data Feeds"]
    M1[Underlying Price Feed]
    M2[Volatility Engine]
    M3[Option Pricing Engine]
end

%% ===========================
%%  DATABASE LAYER
%% ===========================
subgraph DB["Data Layer"]
    D1[(PostgreSQL)]
    D2[(Redis Cache)]
end

%% ===========================
%%  SCHEMA ENTITIES (ERD)
%% ===========================
subgraph ERD["Database Models "]
    U[(User)]
    UND[(Underlying)]
    OC[(OptionContract)]
    ORD[(Order)]
    TR[(Trade)]
    POS[(Position)]
end

%% ===========================
%%  CONNECTIONS — CLIENT TO API
%% ===========================
CLIENT -->|REST/WebSocket| API
API -->|validate & write| D1
API -->|cache| D2

%% ===========================
%%  API TO TRADING ENGINE
%% ===========================
A2 -->|submit order| E1
E1 -->|fills| A6
E1 -->|trigger margin| E2
A6 -->|update positions| A4

%% ===========================
%%  TRADING ENGINE LOOPS
%% ===========================
M1 --> E3
M2 --> M3
M3 --> E3
E3 -->|update PnL| D1

E4 -->|expire & settle| D1
E4 --> API

%% ===========================
%%  MODEL RELATIONS (ERD)
%% ===========================
U <--> POS
U <--> ORD
U <--> TR

UND <--> OC
OC <--> ORD
POS <--> OC
ORD <--> TR

%% ===========================
%%  WRITE PATHS TO DB
%% ===========================
A2 --> D1
A4 --> D1
A6 --> D1
E1 --> D1
E3 --> D1
E4 --> D1
```

`localhost:3001/signup` + `POST`

```json
{
  "email": "test2@example.com",
  "password": "password"
}
```

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJlYzU0MzhhYi1lZGRiLTRkNDMtOWI1Yy0wZmMzZDE4MWRmMTQiLCJpYXQiOjE3NjUzNzM1NjMsImV4cCI6MTc2NTk3ODM2M30.e6pC_t53sXw6O_49t9lPlcY6HcN5OoxN9QbbguxHm8o",
  "user": {
    "id": "ec5438ab-eddb-4d43-9b5c-0fc3d181df14",
    "email": "test2@example.com"
  }
}
```

`localhost:3001/signin` + `POST`

```json
{
  "email": "test2@example.com",
  "password": "password"
}
```

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJlYzU0MzhhYi1lZGRiLTRkNDMtOWI1Yy0wZmMzZDE4MWRmMTQiLCJpYXQiOjE3NjUzNzgzODQsImV4cCI6MTc2NTk4MzE4NH0.wAh3aIpb2Uiy_VnZcRquxB7KFwNafMaHE-Da218R--8",
  "user": {
    "id": "ec5438ab-eddb-4d43-9b5c-0fc3d181df14",
    "email": "test2@example.com"
  }
}
```

`localhost:3001/me` + `GET`

Headers

```json
Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJlYzU0MzhhYi1lZGRiLTRkNDMtOWI1Yy0wZmMzZDE4MWRmMTQiLCJpYXQiOjE3NjUzNzg1NDEsImV4cCI6MTc2NTk4MzM0MX0.hSROYk86IP61bFNF9kVTVmQlMz30l61BZLlDSUrwmbM
```

```json
{
  "user": {
    "id": "ec5438ab-eddb-4d43-9b5c-0fc3d181df14",
    "email": "test2@example.com"
  }
}
```

to do, check out how microservices will work
you have init ui, auth, now check how to trade things
how will things like ws, redis come in hand ; price polling

done

setup kafka:

```sh
docker run --rm confluentinc/cp-kafka:7.6.0 \
          kafka-storage random-uuid
```

copy over uuid

```sh
docker run -d --name kafka \
          -p 9092:9092 \
          -e KAFKA_NODE_ID=1 \
          -e KAFKA_PROCESS_ROLES=broker,controller \
          -e KAFKA_CONTROLLER_QUORUM_VOTERS=1@localhost:9093 \
          -e KAFKA_LISTENERS=PLAINTEXT://0.0.0.0:9092,CONTROLLER://0.0.0.0:9093 \
          -e KAFKA_ADVERTISED_LISTENERS=PLAINTEXT://localhost:9092 \
          -e KAFKA_LISTENER_SECURITY_PROTOCOL_MAP=CONTROLLER:PLAINTEXT,PLAINTEXT:PLAINTEXT \
          -e KAFKA_CONTROLLER_LISTENER_NAMES=CONTROLLER \
          -e KAFKA_CLUSTER_ID=<UUID> \
          confluentinc/cp-kafka:7.6.0
```

need to figure out how kafka sits in picture
