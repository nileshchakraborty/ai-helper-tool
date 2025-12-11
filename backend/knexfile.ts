import type { Knex } from "knex";
import { env } from "./src/config/env";

// Ensure this file is parsed correctly by ts-node/register if run via CLI
const config: Knex.Config = {
    client: "postgresql",
    connection: env.DATABASE_URL,
    pool: {
        min: 2,
        max: 10
    },
    migrations: {
        tableName: "knex_migrations",
        directory: "./src/infra/db/migrations",
        extension: "ts"
    }
};

export default config;
