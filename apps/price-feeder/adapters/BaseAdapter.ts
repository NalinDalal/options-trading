export type RawTick = {
  symbol: string;
  price: number;
  ts: number;
};

export interface FeedAdapter {
  start(onTick: (tick: RawTick) => void): Promise<void>;
  stop(): Promise<void>;
}
