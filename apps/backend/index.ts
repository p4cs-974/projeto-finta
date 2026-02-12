import { Elysia } from "elysia";
import { cryptoRoutes } from "./routes/cryptoRoutes";

const app = new Elysia()
  .get("/", () => "Hello Teste😍");

// registra rotas de cripto
cryptoRoutes(app);

app.listen(3000);
console.log("🚀 API rodando na porta 3000");

