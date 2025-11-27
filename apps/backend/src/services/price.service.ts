import { Injectable, Logger } from '@nestjs/common';
import * as https from 'https';
import * as http from 'http';

const YAHOO_FINANCE_API = 'https://query1.finance.yahoo.com/v8/finance/chart';

const PROXIES = [
  'https://api.allorigins.win/get?url=',
  'https://corsproxy.io/?',
  'https://api.codetabs.com/v1/proxy?quest=',
];

let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1000;
const MAX_RETRIES = 3;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface PriceData {
  price: number;
  timestamp: number;
}

@Injectable()
export class PriceService {
  private readonly logger = new Logger(PriceService.name);
  private async fetchWithProxy(
    url: string,
    proxyIndex: number = 0,
    retryCount: number = 0,
  ): Promise<any> {
    if (retryCount >= MAX_RETRIES) {
      throw new Error('Max retries reached');
    }

    if (proxyIndex >= PROXIES.length) {
      if (retryCount < MAX_RETRIES) {
        await delay(2000 * (retryCount + 1));
        return this.fetchWithProxy(url, 0, retryCount + 1);
      }
      throw new Error('All proxies failed');
    }

    const proxy = PROXIES[proxyIndex];
    const proxyUrl = proxy + encodeURIComponent(url);

    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
      await delay(MIN_REQUEST_INTERVAL - timeSinceLastRequest);
    }
    lastRequestTime = Date.now();

    try {
      this.logger.debug(`Fetching ${proxyUrl} (proxy: ${proxyIndex}, retry: ${retryCount})`);
      
      let response: Response;
      
      if (typeof fetch !== 'undefined') {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);
        
        response = await fetch(proxyUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
      } else {
        const url = new URL(proxyUrl);
        const httpModule = url.protocol === 'https:' ? https : http;
        
        response = await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            req.destroy();
            reject(new Error('Request timeout'));
          }, 30000);
          
          const req = httpModule.get(url, (res) => {
            clearTimeout(timeout);
            let data = '';
            res.on('data', (chunk) => {
              data += chunk;
            });
            res.on('end', () => {
              resolve({
                ok: res.statusCode && res.statusCode >= 200 && res.statusCode < 300,
                status: res.statusCode || 500,
                json: async () => JSON.parse(data),
                text: async () => data,
              } as Response);
            });
          });
          
          req.on('error', (err) => {
            clearTimeout(timeout);
            reject(err);
          });
        });
      }

      if (response.status === 429) {
        this.logger.warn(`Rate limited, retrying with next proxy`);
        await delay(2000 * (retryCount + 1));
        return this.fetchWithProxy(url, (proxyIndex + 1) % PROXIES.length, retryCount);
      }

      if (!response.ok) {
        this.logger.warn(`HTTP error ${response.status} from proxy ${proxyIndex}`);
        if (proxyIndex < PROXIES.length - 1) {
          return this.fetchWithProxy(url, proxyIndex + 1, retryCount);
        }
        if (retryCount < MAX_RETRIES) {
          await delay(2000 * (retryCount + 1));
          return this.fetchWithProxy(url, 0, retryCount + 1);
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (proxy.includes('allorigins.win')) {
        const proxyData = await response.json();
        return JSON.parse(proxyData.contents);
      } else {
        return await response.json();
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        this.logger.warn(`Request timeout for proxy ${proxyIndex}`);
      } else {
        this.logger.warn(`Error with proxy ${proxyIndex}: ${error.message}`);
      }
      
      if (proxyIndex < PROXIES.length - 1) {
        return this.fetchWithProxy(url, proxyIndex + 1, retryCount);
      }
      if (retryCount < MAX_RETRIES) {
        await delay(2000 * (retryCount + 1));
        return this.fetchWithProxy(url, 0, retryCount + 1);
      }
      throw error;
    }
  }

  async fetchMultiplePrices(
    symbols: { symbol: string; type: 'stock' | 'crypto' | 'bond' }[],
  ): Promise<Map<string, PriceData>> {
    const priceMap = new Map<string, PriceData>();

    if (symbols.length === 0) {
      return priceMap;
    }

    const stocks = symbols
      .filter((s) => s.type === 'stock' || s.type === 'bond')
      .map((s) => {
        const symbol = s.symbol.toUpperCase();
        if (symbol.endsWith('.WA') || symbol.endsWith('.PL')) {
          return symbol;
        }
        return symbol;
      });
    const cryptos = symbols
      .filter((s) => s.type === 'crypto')
      .map((s) => (s.symbol.includes('-') ? s.symbol : `${s.symbol}-USD`));

    this.logger.log(`Fetching prices for ${stocks.length} stocks and ${cryptos.length} cryptos`);

    try {
      if (stocks.length > 0) {
        const stocksSymbols = stocks.join(',');
        const url = `${YAHOO_FINANCE_API}/${stocksSymbols}?interval=1d&range=1d`;
        this.logger.debug(`Fetching stocks: ${stocksSymbols}`);
        
        try {
          const data = await this.fetchWithProxy(url, 0, 0);

          if (data?.chart?.result) {
            data.chart.result.forEach((result: any, index: number) => {
              if (result?.meta) {
                const meta = result.meta;
                const symbol = stocks[index]?.toUpperCase();
                const currentPrice =
                  meta.regularMarketPrice || meta.regularMarketPreviousClose;

                if (currentPrice && symbol) {
                  priceMap.set(symbol, {
                    price: currentPrice,
                    timestamp: Date.now(),
                  });
                  this.logger.debug(`Got price for ${symbol}: ${currentPrice}`);
                }
              }
            });
          } else {
            this.logger.warn(`No chart data received for stocks: ${stocksSymbols}`);
          }
        } catch (error: any) {
          this.logger.error(`Failed to fetch stock prices: ${error.message}`);
        }
      }

      if (cryptos.length > 0) {
        const cryptoSymbols = cryptos.join(',');
        const url = `${YAHOO_FINANCE_API}/${cryptoSymbols}?interval=1d&range=1d`;
        this.logger.debug(`Fetching cryptos: ${cryptoSymbols}`);
        
        try {
          const data = await this.fetchWithProxy(url, 0, 0);

          if (data?.chart?.result) {
            data.chart.result.forEach((result: any, index: number) => {
              if (result?.meta) {
                const meta = result.meta;
                const fullSymbol = cryptos[index];
                const symbol = fullSymbol?.replace('-USD', '').toUpperCase();
                const currentPrice =
                  meta.regularMarketPrice || meta.regularMarketPreviousClose;

                if (currentPrice && symbol) {
                  priceMap.set(symbol, {
                    price: currentPrice,
                    timestamp: Date.now(),
                  });
                  this.logger.debug(`Got price for ${symbol}: ${currentPrice}`);
                }
              }
            });
          } else {
            this.logger.warn(`No chart data received for cryptos: ${cryptoSymbols}`);
          }
        } catch (error: any) {
          this.logger.error(`Failed to fetch crypto prices: ${error.message}`);
        }
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.logger.error('Error fetching bulk prices:', error.message);
      }
    }

    this.logger.log(`Successfully fetched ${priceMap.size} prices out of ${symbols.length} symbols`);
    return priceMap;
  }
}

