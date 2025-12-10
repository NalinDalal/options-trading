"use client";
export default function TradingLanding() {
  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-hidden">
      {/* Ambient Background */}
      <div className="fixed inset-0 bg-slate-950">
        <div className="absolute top-20 left-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-slate-800/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">T</span>
            </div>
            <span className="text-xl font-bold">TradeFlow</span>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            <a
              href="#"
              className="text-slate-400 hover:text-white transition-colors"
            >
              Markets
            </a>
            <a
              href="#"
              className="text-slate-400 hover:text-white transition-colors"
            >
              Platform
            </a>
            <a
              href="#"
              className="text-slate-400 hover:text-white transition-colors"
            >
              Academy
            </a>
            <a
              href="#"
              className="text-slate-400 hover:text-white transition-colors"
            >
              Pricing
            </a>
          </nav>

          <div className="flex items-center gap-4">
            <button
              className="text-slate-400 hover:text-white transition-colors"
              onClick={() => (window.location.href = "/signin")}
            >
              Sign In
            </button>
            <button
              className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg font-medium transition-colors"
              onClick={() => (window.location.href = "/signup")}
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-32">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-2 mb-6">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-blue-400">
                Live Markets Available
              </span>
            </div>

            <h1 className="text-6xl font-bold mb-6 leading-tight">
              Trade Smarter,
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
                Not Harder
              </span>
            </h1>

            <p className="text-xl text-slate-400 mb-8 leading-relaxed">
              Access global markets with institutional-grade tools. Real-time
              data, advanced charting, and seamless execution—all in one
              powerful platform.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <button className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 px-8 py-4 rounded-lg font-semibold transition-all shadow-lg shadow-blue-500/25">
                Start Trading Now
              </button>
              <button className="border border-slate-700 hover:border-slate-600 px-8 py-4 rounded-lg font-semibold transition-colors">
                Watch Demo
              </button>
            </div>

            <div className="flex items-center gap-8">
              <div>
                <div className="text-3xl font-bold">$2.5T+</div>
                <div className="text-sm text-slate-400">Daily Volume</div>
              </div>
              <div className="w-px h-12 bg-slate-800"></div>
              <div>
                <div className="text-3xl font-bold">180+</div>
                <div className="text-sm text-slate-400">Countries</div>
              </div>
              <div className="w-px h-12 bg-slate-800"></div>
              <div>
                <div className="text-3xl font-bold">24/7</div>
                <div className="text-sm text-slate-400">Support</div>
              </div>
            </div>
          </div>

          {/* Trading Dashboard Preview */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl blur-2xl"></div>
            <div className="relative bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="text-sm text-slate-400 mb-1">
                    Portfolio Value
                  </div>
                  <div className="text-3xl font-bold">$47,582.91</div>
                </div>
                <div className="text-right">
                  <div className="text-green-400 text-lg font-semibold">
                    +$2,847.23
                  </div>
                  <div className="text-sm text-slate-400">+6.35% today</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                {[
                  {
                    name: "BTC/USD",
                    price: "68,245",
                    change: "+3.2%",
                    color: "orange",
                  },
                  {
                    name: "EUR/USD",
                    price: "1.0875",
                    change: "+0.8%",
                    color: "blue",
                  },
                  {
                    name: "AAPL",
                    price: "187.45",
                    change: "-1.2%",
                    color: "slate",
                  },
                  {
                    name: "GOLD",
                    price: "2,042",
                    change: "+2.1%",
                    color: "yellow",
                  },
                ].map((asset, i) => (
                  <div
                    key={i}
                    className="bg-slate-800/50 rounded-xl p-4 hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className={`w-2 h-2 bg-${asset.color}-500 rounded-full`}
                      ></div>
                      <span className="text-sm text-slate-300">
                        {asset.name}
                      </span>
                    </div>
                    <div className="text-xl font-semibold mb-1">
                      {asset.price}
                    </div>
                    <div
                      className={`text-sm ${asset.change.startsWith("+") ? "text-green-400" : "text-red-400"}`}
                    >
                      {asset.change}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <button className="flex-1 bg-green-600 hover:bg-green-700 py-3 rounded-lg font-semibold transition-colors">
                  Buy
                </button>
                <button className="flex-1 bg-red-600 hover:bg-red-700 py-3 rounded-lg font-semibold transition-colors">
                  Sell
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">
            Everything You Need to Trade
          </h2>
          <p className="text-xl text-slate-400">
            Professional tools for serious traders
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: "⚡",
              title: "Lightning Fast",
              description:
                "Execute trades in milliseconds with our optimized infrastructure",
            },
            {
              icon: "📊",
              title: "Advanced Charts",
              description:
                "Professional-grade charting powered by TradingView integration",
            },
            {
              icon: "🔒",
              title: "Bank-Level Security",
              description:
                "Your funds are protected with institutional-grade encryption",
            },
            {
              icon: "📱",
              title: "Trade Anywhere",
              description:
                "Mobile apps for iOS and Android with full platform features",
            },
            {
              icon: "🤖",
              title: "Automated Trading",
              description:
                "Build and deploy trading bots with our powerful API",
            },
            {
              icon: "💰",
              title: "Low Fees",
              description:
                "Competitive spreads and zero commission on most trades",
            },
          ].map((feature, i) => (
            <div
              key={i}
              className="bg-slate-900/50 border border-slate-800 rounded-xl p-8 hover:border-blue-500/50 transition-colors"
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
              <p className="text-slate-400">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-slate-800 rounded-2xl p-12">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 mb-2">
                500+
              </div>
              <div className="text-slate-400">Trading Instruments</div>
            </div>
            <div>
              <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 mb-2">
                50ms
              </div>
              <div className="text-slate-400">Average Execution</div>
            </div>
            <div>
              <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 mb-2">
                99.99%
              </div>
              <div className="text-slate-400">Uptime SLA</div>
            </div>
            <div>
              <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 mb-2">
                2M+
              </div>
              <div className="text-slate-400">Active Traders</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl p-12 text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Start Trading?</h2>
          <p className="text-xl mb-8 text-blue-100">
            Join millions of traders worldwide
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-blue-600 hover:bg-slate-100 px-8 py-4 rounded-lg font-semibold transition-colors">
              Create Free Account
            </button>
            {/*TODO: basically allows to dirctly log into a demo account, be handles everything */}
            <button className="border-2 border-white hover:bg-white/10 px-8 py-4 rounded-lg font-semibold transition-colors">
              Try Demo Account
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800 mt-20">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">T</span>
                </div>
                <span className="text-xl font-bold">TradeFlow</span>
              </div>
              <p className="text-slate-400 text-sm">
                Professional trading platform for global markets
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <div className="space-y-2 text-slate-400 text-sm">
                <div>Trading Platform</div>
                <div>Mobile Apps</div>
                <div>API Access</div>
                <div>Pricing</div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <div className="space-y-2 text-slate-400 text-sm">
                <div>Learning Center</div>
                <div>Market News</div>
                <div>Documentation</div>
                <div>Support</div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <div className="space-y-2 text-slate-400 text-sm">
                <div>About Us</div>
                <div>Careers</div>
                <div>Legal</div>
                <div>Contact</div>
              </div>
            </div>
          </div>
          <div className="pt-8 border-t border-slate-800 text-center text-slate-400 text-sm">
            © 2024 TradeFlow. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
