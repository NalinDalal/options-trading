import { FeedAdapter, RawTick } from "./BaseAdapter";

export class SimulatorAdapter implements FeedAdapter {
  private running = false;

  async start(onTick: (tick: RawTick) => void) {
    this.running = true;

    while (this.running) {
      onTick({
        symbol: "NIFTY",
        price: 22500 + Math.random() * 50,
        ts: Date.now(),
      });

      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  async stop() {
    this.running = false;
  }
}
