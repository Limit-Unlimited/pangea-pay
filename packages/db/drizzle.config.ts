import { defineConfig } from "drizzle-kit";

const host     = process.env.DB_HOST     ?? "localhost";
const port     = process.env.DB_PORT     ?? "3306";
const user     = process.env.DB_USER     ?? "root";
const password = process.env.DB_PASSWORD ?? "";
const database = process.env.DB_NAME     ?? "pangea_pay";

const url = password
  ? `mysql://${user}:${password}@${host}:${port}/${database}`
  : `mysql://${user}@${host}:${port}/${database}`;

export default defineConfig({
  schema: "./src/schema/index.ts",
  out: "./src/migrations",
  dialect: "mysql",
  dbCredentials: { url },
  verbose: true,
  strict: true,
});
