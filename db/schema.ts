import {sqliteTable,text,integer,uniqueIndex} from 'drizzle-orm/sqlite-core';
export const newsPosts=sqliteTable('news_posts',{
 id:text('id').primaryKey(), eventKey:text('event_key').notNull(), story:text('story').notNull(),body:text('body').notNull(),mode:text('mode').notNull().default('source'),promo:integer('promo').notNull().default(0),createdAt:integer('created_at').notNull(),updatedAt:integer('updated_at').notNull(),delivery:text('delivery').notNull().default('baseline'),telegramMessageId:integer('telegram_message_id'),attempts:integer('attempts').notNull().default(0),nextAttempt:integer('next_attempt').notNull().default(0),error:text('error')
},t=>[uniqueIndex('news_posts_event_key_idx').on(t.eventKey)]);
export const newsMeta=sqliteTable('news_meta',{key:text('key').primaryKey(),value:text('value').notNull()});
