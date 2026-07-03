import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const apiKey = sqliteTable('api_key', {
	apiKeyId: integer('api_key_id').primaryKey({ autoIncrement: true }),
	key: text('key').notNull(),
	name: text('name').notNull().default(''),
	userId: integer('user_id').notNull(),
	status: integer('status').default(0).notNull(),
	expireTime: text('expire_time'),
	createTime: text('create_time').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export default apiKey;
