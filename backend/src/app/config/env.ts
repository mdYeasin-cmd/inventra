import dotenv from "dotenv";
import { Secret } from "jsonwebtoken";

dotenv.config();

interface EnvConfig {
  PORT: string;
  DB_URL: string;
  NODE_ENV: "development" | "production";
  JWT_SECRET: Secret;
}

const loadEnvVariables = (): EnvConfig => {
  const requiredEnvVariables = ["PORT", "DB_URL", "NODE_ENV", "JWT_SECRET"];
  requiredEnvVariables.forEach((key) => {
    if (!process.env[key]) {
      throw new Error(
        `Environment variable ${key} is required but not defined.`,
      );
    }
  });

  return {
    PORT: process.env.PORT as string,
    DB_URL: process.env.DB_URL as string,
    NODE_ENV: process.env.NODE_ENV as "development" | "production",
    JWT_SECRET: process.env.JWT_SECRET as Secret,
  };
};

export const envVars: EnvConfig = loadEnvVariables();
