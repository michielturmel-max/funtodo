ALTER TABLE `players` ADD `total_xp` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
UPDATE `players` SET `total_xp` = COALESCE((SELECT SUM(`amount`) FROM `xp_events` WHERE `xp_events`.`user_id` = `players`.`user_id`), 0);--> statement-breakpoint
ALTER TABLE `players` ADD `avatar` text DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE `players` ADD `owned_items` text DEFAULT '[]' NOT NULL;