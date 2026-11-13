CREATE TABLE `activity_days` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`date` text NOT NULL,
	`quests_completed` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `activity_user_date_idx` ON `activity_days` (`user_id`,`date`);--> statement-breakpoint
CREATE TABLE `focus_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`quest_id` text NOT NULL,
	`user_id` text NOT NULL,
	`minutes` integer NOT NULL,
	`damage` integer DEFAULT 0 NOT NULL,
	`started_at` text NOT NULL,
	`ended_at` text NOT NULL,
	FOREIGN KEY (`quest_id`) REFERENCES `quests`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `focus_quest_idx` ON `focus_sessions` (`quest_id`);--> statement-breakpoint
CREATE TABLE `players` (
	`user_id` text PRIMARY KEY NOT NULL,
	`display_name` text NOT NULL,
	`timezone` text DEFAULT 'Europe/Amsterdam' NOT NULL,
	`coins` integer DEFAULT 0 NOT NULL,
	`streak_count` integer DEFAULT 0 NOT NULL,
	`longest_streak` integer DEFAULT 0 NOT NULL,
	`last_active_date` text,
	`grace_used` integer DEFAULT 0 NOT NULL,
	`grace_month` text,
	`camp_level` integer DEFAULT 1 NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `quests` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`next_action` text NOT NULL,
	`domain` text NOT NULL,
	`difficulty` integer DEFAULT 2 NOT NULL,
	`importance` integer DEFAULT 2 NOT NULL,
	`estimate_min` integer DEFAULT 25 NOT NULL,
	`scheduled_date` text,
	`is_main` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'planned' NOT NULL,
	`deferred_count` integer DEFAULT 0 NOT NULL,
	`boss_max_hp` integer DEFAULT 0 NOT NULL,
	`boss_hp` integer DEFAULT 0 NOT NULL,
	`notes` text,
	`created_at` text NOT NULL,
	`planned_at` text,
	`started_at` text,
	`completed_at` text,
	`actual_min` integer,
	`xp_awarded` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `quests_user_date_idx` ON `quests` (`user_id`,`scheduled_date`);--> statement-breakpoint
CREATE INDEX `quests_user_status_idx` ON `quests` (`user_id`,`status`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `sessions_user_idx` ON `sessions` (`user_id`);--> statement-breakpoint
CREATE TABLE `subtasks` (
	`id` text PRIMARY KEY NOT NULL,
	`quest_id` text NOT NULL,
	`title` text NOT NULL,
	`done` integer DEFAULT 0 NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`quest_id`) REFERENCES `quests`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `subtasks_quest_idx` ON `subtasks` (`quest_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`username` text NOT NULL,
	`name` text NOT NULL,
	`password_hash` text NOT NULL,
	`role` text DEFAULT 'member' NOT NULL,
	`created_at` text NOT NULL,
	`last_login_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_idx` ON `users` (`username`);--> statement-breakpoint
CREATE TABLE `xp_events` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`quest_id` text,
	`domain` text NOT NULL,
	`amount` integer NOT NULL,
	`reason` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`quest_id`) REFERENCES `quests`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `xp_user_idx` ON `xp_events` (`user_id`,`created_at`);