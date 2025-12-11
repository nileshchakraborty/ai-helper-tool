import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable("users", (table) => {
        table.uuid("id").primary().defaultTo(knex.fn.uuid());
        table.string("email").unique().notNullable();
        table.string("full_name").notNullable();
        table.string("password_hash").notNullable();
        table.jsonb("preferences").defaultTo("{}"); // Privacy, AI Model choice
        table.timestamp("created_at").defaultTo(knex.fn.now());
        table.timestamp("updated_at").defaultTo(knex.fn.now());
    });

    await knex.schema.createTable("sessions", (table) => {
        table.uuid("id").primary().defaultTo(knex.fn.uuid());
        table.uuid("user_id").references("id").inTable("users").onDelete("CASCADE");
        table.string("title").notNullable();
        table.string("type").notNullable(); // 'behavioral', 'coding'
        table.string("status").defaultTo("active");
        table.timestamp("created_at").defaultTo(knex.fn.now());
        table.timestamp("ended_at");
    });

    await knex.schema.createTable("messages", (table) => {
        table.uuid("id").primary().defaultTo(knex.fn.uuid());
        table.uuid("session_id").references("id").inTable("sessions").onDelete("CASCADE");
        table.string("role").notNullable(); // 'user', 'assistant', 'system'
        table.text("content").notNullable();
        table.timestamp("created_at").defaultTo(knex.fn.now());
    });
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTableIfExists("messages");
    await knex.schema.dropTableIfExists("sessions");
    await knex.schema.dropTableIfExists("users");
}
