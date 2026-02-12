import axios from "axios";

export class CryptoAgent {
  async getPrice(symbol: string) {
    const response = await axios.get(
      `https://api.coingecko.com/api/v3/simple/price?ids=${symbol}&vs_currencies=usd`
    );
    return response.data;
  }
}

