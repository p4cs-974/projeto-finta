// DEXSCREENER_API = endereço da API do DexScreener
// API = jeito de pedir dados de um site/servidor
// Docs: https://docs.dexscreener.com/api/reference
const DEXSCREENER_API = "https://api.dexscreener.com/latest/dex";

// Interface = formato que diz como os dados devem vir
// Aqui definimos o formato do preço que vamos retornar
interface TokenPrice {
  symbol: string; // nome da moeda (BTC, ETH)
  priceUsd: number; // preço em dólares
  priceChange24h: number | null; // mudança de preço em 24h (pode ser nulo)
  volume24h: number; // quanto foi negociado em 24h
  liquidity: number; // dinheiro disponível na pool
  source: string; // qual exchange (uniswap, pancakeswap)
}

// Função principal - recebe o símbolo da moeda e retorna o preço
// Ex: getPrice("BTC") → retorna dados do Bitcoin
export async function getPrice(symbol: string): Promise<TokenPrice> {
  // Limpa o símbolo: tira espaços e deixa maiúsculo
  // BTC, btc, BtC → vira "BTC"
  const cleanSymbol = symbol.toUpperCase().trim();

  // fetch = função do que faz requisições HTTP
  // Faz a chamada pra API do DexScreener
  // encodeURIComponent = protege caracteres especiais na URL
  // Docs: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent
  const response = await Bun.fetch(
    `${DEXSCREENER_API}/search?q=${encodeURIComponent(cleanSymbol)}`,
  );

  // Se a API deu erro (404, 500, etc), joga um erro
  if (!response.ok) {
    throw new Error(`DexScreener API error: ${response.status}`);
  }

  // response.json() = converte a resposta de JSON para objeto JavaScript
  // JSON = formato de texto que APIs usam pra trocar dados
  // Docs: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON
  const data = await response.json();

  // Se não achou nenhum par de trading com essa moeda
  if (!data.pairs || data.pairs.length === 0) {
    throw new Error(`No pairs found for symbol: ${cleanSymbol}`);
  }

  // Procura um par onde a moeda base seja exatamente o símbolo pedido
  // Se não achar, pega o primeiro resultado
  const pair =
    data.pairs.find(
      (p: { baseToken: { symbol: string } }) =>
        p.baseToken.symbol.toUpperCase() === cleanSymbol,
    ) || data.pairs[0];

  // parseFloat = converte string "123.45" para número 123.45
  // A API retorna tudo como texto, precisamos converter
  // Docs: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/parseFloat
  return {
    symbol: pair.baseToken.symbol,
    priceUsd: parseFloat(pair.priceUsd) || 0,
    priceChange24h: pair.priceChange?.h24
      ? parseFloat(pair.priceChange.h24)
      : null,
    volume24h: pair.volume?.h24 ? parseFloat(pair.volume.h24) : 0,
    liquidity: pair.liquidity?.usd ? parseFloat(pair.liquidity.usd) : 0,
    source: pair.dexId,
  };
}
