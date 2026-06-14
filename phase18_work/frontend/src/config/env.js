import { z } from "zod";

const booleanStringSchema = z
  .union([z.boolean(), z.enum(["true", "false"])])
  .transform((value) => value === true || value === "true");

const envSchema = z.object({
  APP_NAME: z.string().min(1),
  API_BASE_URL: z.string().min(1),
  API_ORIGIN: z.string().url().optional(),
  ENABLE_API_MOCKING: booleanStringSchema,
  MODE: z.string().min(1),
  IS_PROD: z.boolean(),
  IS_DEV: z.boolean(),
  ADMIN_LOGIN_PATH: z.string().min(1),
});

const rawEnv = {
  APP_NAME: import.meta.env.VITE_APP_NAME ?? "Midi Cosmetics",
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL ?? "/api/v1",
  API_ORIGIN: import.meta.env.VITE_API_ORIGIN || (typeof window !== "undefined" ? window.location.origin : "http://localhost:8080"),
  ENABLE_API_MOCKING: import.meta.env.VITE_ENABLE_API_MOCKING ?? "false",
  MODE: import.meta.env.MODE,
  IS_PROD: import.meta.env.PROD,
  IS_DEV: import.meta.env.DEV,
  ADMIN_LOGIN_PATH: import.meta.env.VITE_ADMIN_LOGIN_PATH ?? "/quan-tri-midi-secure-2026",
};

const parsedEnv = envSchema.safeParse(rawEnv);

if (!parsedEnv.success) {
  console.error("Invalid environment variables", parsedEnv.error.flatten().fieldErrors);
  throw new Error("Invalid environment variables");
}

export const env = parsedEnv.data;


export function normalizeAppPath(path, fallback = "/") {
  const value = String(path || "").trim();
  if (!value) return fallback;
  const withSlash = value.startsWith("/") ? value : `/${value}`;
  return withSlash.replace(/\/+/g, "/");
}
