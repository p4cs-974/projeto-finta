import { Elysia } from "elysia";
import { getCryptoPrice } from "../controllers/cryptoController";

export const cryptoRoutes = (app: Elysia) =>
  app.get("/crypto/:symbol", getCryptoPrice);

