CREATE TABLE `news_meta` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `news_posts` (
	`id` text PRIMARY KEY NOT NULL,
	`event_key` text NOT NULL,
	`story` text NOT NULL,
	`body` text NOT NULL,
	`mode` text DEFAULT 'source' NOT NULL,
	`promo` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`delivery` text DEFAULT 'baseline' NOT NULL,
	`telegram_message_id` integer,
	`attempts` integer DEFAULT 0 NOT NULL,
	`next_attempt` integer DEFAULT 0 NOT NULL,
	`error` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `news_posts_event_key_idx` ON `news_posts` (`event_key`);