import { CryptoAgent } from "../agents/cryptoAgent";
import { Context } from "elysia";

const cryptoAgent = new CryptoAgent();

export const getCryptoPrice = async ({ params }: Context) => {
  const { symbol } = params;
  try {
    const price = await cryptoAgent.getPrice(symbol);
    return price;
  } catch (error) {
    console.error(error);
    return { error: "Erro ao buscar preço da cripto" };
  }
};

