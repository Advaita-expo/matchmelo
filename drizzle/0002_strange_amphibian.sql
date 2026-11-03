CREATE TABLE `media_deletions` (
	`object_key` text PRIMARY KEY NOT NULL,
	`not_before` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `media_deletion_ready_idx` ON `media_deletions` (`not_before`);