import * as z from "zod";

const Usuario = z.object({
  id: z.string(),
  nome: z.string(),
  email: z.email(),
});
