CREATE TABLE `plugin_tokens` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`token_hash` text NOT NULL,
	`prefix` text NOT NULL,
	`label` text NOT NULL,
	`created_at` text NOT NULL,
	`last_used_at` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `plugin_tokens_hash_idx` ON `plugin_tokens` (`token_hash`);--> statement-breakpoint
CREATE INDEX `plugin_tokens_user_idx` ON `plugin_tokens` (`user_id`);