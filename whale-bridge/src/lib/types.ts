export interface Currency {
  ticker: string;
  name: string;
  image: string;
  network: string;
  hasExternalId: boolean;
  isFiat: boolean;
}

export interface MinAmountResponse {
  minAmount: number;
}

export interface EstimatedAmountResponse {
  estimatedAmount: number;
  transactionSpeedForecast: string;
  warningMessage: string | null;
}

export interface CreateTransactionPayload {
  from: string;
  to: string;
  amount: number;
  address: string;
  extraId?: string;
}

export interface TransactionResponse {
  id: string;
  payinAddress: string;
  payinExtraId?: string;
  payoutAddress: string;
  payoutExtraId?: string;
  fromCurrency: string;
  toCurrency: string;
  amount: number;
  status: string;
}

export interface TransactionStatus {
  id: string;
  status: 'new' | 'waiting' | 'confirming' | 'exchanging' | 'sending' | 'finished' | 'failed' | 'refunded' | 'verifying';
  payinAddress: string;
  payoutAddress: string;
  fromCurrency: string;
  toCurrency: string;
  amountSend: number | null;
  amountReceive: number | null;
  payinHash: string | null;
  payoutHash: string | null;
}

export type SwapStage = 'estimate' | 'deposit' | 'status';

export interface SwapState {
  stage: SwapStage;
  fromCurrency: string;
  fromAmount: string;
  estimatedAmount: string;
  walletAddress: string;
  minAmount: number | null;
  transactionId: string | null;
  payinAddress: string | null;
  payinExtraId?: string | null;
  status: TransactionStatus['status'] | null;
}

// Supported "from" currencies with real logo icons & tickers
export const SUPPORTED_CURRENCIES = [
  { ticker: 'btc', name: 'Bitcoin', symbol: 'BTC', icon: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png', color: '#f7931a' },
  { ticker: 'eth', name: 'Ethereum', symbol: 'ETH', icon: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png', color: '#627eea' },
  { ticker: 'sol', name: 'Solana', symbol: 'SOL', icon: 'https://assets.coingecko.com/coins/images/4128/small/solana.png', color: '#9945ff' },
  { ticker: 'usdc', name: 'USD Coin', symbol: 'USDC', icon: 'https://assets.coingecko.com/coins/images/6319/small/usdc.png', color: '#2775ca' },
  { ticker: 'usdt', name: 'Tether', symbol: 'USDT', icon: 'https://assets.coingecko.com/coins/images/325/small/Tether.png', color: '#26a17b' },
  { ticker: 'bnb', name: 'BNB', symbol: 'BNB', icon: 'https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png', color: '#f3ba2f' },
  { ticker: 'xrp', name: 'Ripple', symbol: 'XRP', icon: 'https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png', color: '#00aae4' },
  { ticker: 'doge', name: 'Dogecoin', symbol: 'DOGE', icon: 'https://assets.coingecko.com/coins/images/5/small/dogecoin.png', color: '#c3a634' },
  { ticker: 'matic', name: 'Polygon', symbol: 'MATIC', icon: 'https://assets.coingecko.com/coins/images/4713/small/polygon.png', color: '#8247e5' },
  { ticker: 'ltc', name: 'Litecoin', symbol: 'LTC', icon: 'https://assets.coingecko.com/coins/images/2/small/litecoin.png', color: '#bfbbbb' },
] as const;

// WhiteWhale token — the "To" side is always locked
export const WHITEWHALE = {
  ticker: 'whitewhale', // placeholder ticker for ChangeNow
  name: '$WHITEWHALE',
  symbol: 'WHITEWHALE',
  network: 'Solana',
  contractAddress: '9gYxfSYf58w17UPnU127kN14XTHhaRRNqY1vcEVGpump',
};
