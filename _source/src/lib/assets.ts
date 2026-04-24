// Top 20 universe — Binance USDT-margined perp + spot symbols
export interface Asset {
  symbol: string;          // Binance spot symbol e.g. BTCUSDT
  perpSymbol: string;      // Binance USDM perp e.g. BTCUSDT
  base: string;            // BTC
  name: string;
  cgId: string;            // CoinGecko id (for metadata only, optional)
}

export const ASSETS: Asset[] = [
  { symbol: "BTCUSDT", perpSymbol: "BTCUSDT", base: "BTC", name: "Bitcoin", cgId: "bitcoin" },
  { symbol: "ETHUSDT", perpSymbol: "ETHUSDT", base: "ETH", name: "Ethereum", cgId: "ethereum" },
  { symbol: "SOLUSDT", perpSymbol: "SOLUSDT", base: "SOL", name: "Solana", cgId: "solana" },
  { symbol: "BNBUSDT", perpSymbol: "BNBUSDT", base: "BNB", name: "BNB", cgId: "binancecoin" },
  { symbol: "XRPUSDT", perpSymbol: "XRPUSDT", base: "XRP", name: "XRP", cgId: "ripple" },
  { symbol: "ADAUSDT", perpSymbol: "ADAUSDT", base: "ADA", name: "Cardano", cgId: "cardano" },
  { symbol: "DOGEUSDT", perpSymbol: "DOGEUSDT", base: "DOGE", name: "Dogecoin", cgId: "dogecoin" },
  { symbol: "AVAXUSDT", perpSymbol: "AVAXUSDT", base: "AVAX", name: "Avalanche", cgId: "avalanche-2" },
  { symbol: "LINKUSDT", perpSymbol: "LINKUSDT", base: "LINK", name: "Chainlink", cgId: "chainlink" },
  { symbol: "TONUSDT", perpSymbol: "TONUSDT", base: "TON", name: "Toncoin", cgId: "the-open-network" },
  { symbol: "DOTUSDT", perpSymbol: "DOTUSDT", base: "DOT", name: "Polkadot", cgId: "polkadot" },
  { symbol: "MATICUSDT", perpSymbol: "MATICUSDT", base: "MATIC", name: "Polygon", cgId: "matic-network" },
  { symbol: "LTCUSDT", perpSymbol: "LTCUSDT", base: "LTC", name: "Litecoin", cgId: "litecoin" },
  { symbol: "BCHUSDT", perpSymbol: "BCHUSDT", base: "BCH", name: "Bitcoin Cash", cgId: "bitcoin-cash" },
  { symbol: "NEARUSDT", perpSymbol: "NEARUSDT", base: "NEAR", name: "NEAR Protocol", cgId: "near" },
  { symbol: "ATOMUSDT", perpSymbol: "ATOMUSDT", base: "ATOM", name: "Cosmos", cgId: "cosmos" },
  { symbol: "APTUSDT", perpSymbol: "APTUSDT", base: "APT", name: "Aptos", cgId: "aptos" },
  { symbol: "ARBUSDT", perpSymbol: "ARBUSDT", base: "ARB", name: "Arbitrum", cgId: "arbitrum" },
  { symbol: "OPUSDT", perpSymbol: "OPUSDT", base: "OP", name: "Optimism", cgId: "optimism" },
  { symbol: "INJUSDT", perpSymbol: "INJUSDT", base: "INJ", name: "Injective", cgId: "injective-protocol" },
];

export const SYMBOL_TO_ASSET: Record<string, Asset> = ASSETS.reduce((acc, a) => {
  acc[a.symbol] = a;
  return acc;
}, {} as Record<string, Asset>);

export const getAsset = (symbol: string): Asset | undefined => SYMBOL_TO_ASSET[symbol.toUpperCase()];
