import axios from "axios";

export class CryptoService {
  private customPrices: Record<string, number> = {};

  async getPrice(symbol: string) {
    const response = await axios.get(
      `https://api.coingecko.com/api/v3/simple/price?ids=${symbol}&vs_currencies=usd`
    );
    return response.data;
  }

  updatePrice(symbol: string, price: number) {
    this.customPrices[symbol] = price;
    return { symbol, price };
  }

  getCustomPrice(symbol: string) {
    return this.customPrices[symbol] || null;
  }
}

