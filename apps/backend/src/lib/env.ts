type Env = {
  DATABASE_URL: string;
  JWT_SECRET: string;
  PORT: number;
};

function readRequiredEnv(name: "DATABASE_URL" | "JWT_SECRET"): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} is required.`);
  }

  return value;
}

function readPort(): number {
  const rawPort = process.env.PORT?.trim();

  if (!rawPort) {
    return 3000;
  }

  const port = Number(rawPort);

  if (!Number.isInteger(port) || port <= 0) {
    throw new Error("PORT must be a positive integer.");
  }

  return port;
}

export const env: Env = {
  DATABASE_URL: readRequiredEnv("DATABASE_URL"),
  JWT_SECRET: readRequiredEnv("JWT_SECRET"),
  PORT: readPort(),
};
