CREATE TABLE `auth_account` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`user_id` text NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` integer,
	`refresh_token_expires_at` integer,
	`scope` text,
	`password` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `auth_user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `auth_account_user_idx` ON `auth_account` (`user_id`);--> statement-breakpoint
CREATE TABLE `auth_rate_limit` (
	`id` text PRIMARY KEY NOT NULL,
	`key` text NOT NULL,
	`count` integer NOT NULL,
	`last_request` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `auth_rate_limit_key_unique` ON `auth_rate_limit` (`key`);--> statement-breakpoint
CREATE TABLE `auth_session` (
	`id` text PRIMARY KEY NOT NULL,
	`expires_at` integer NOT NULL,
	`token` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`user_id` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `auth_user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `auth_session_token_unique` ON `auth_session` (`token`);--> statement-breakpoint
CREATE INDEX `auth_session_user_idx` ON `auth_session` (`user_id`);--> statement-breakpoint
CREATE TABLE `auth_user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`image` text,
	`disabled` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `auth_user_email_unique` ON `auth_user` (`email`);--> statement-breakpoint
CREATE TABLE `auth_verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `auth_verification_identifier_idx` ON `auth_verification` (`identifier`);--> statement-breakpoint
CREATE TABLE `app_rate_limits` (
	`key` text PRIMARY KEY NOT NULL,
	`count` integer NOT NULL,
	`window_start` integer NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `member_blocks` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`target_id` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `member_block_unique` ON `member_blocks` (`user_id`,`target_id`);--> statement-breakpoint
CREATE TABLE `call_feedback` (
	`id` text PRIMARY KEY NOT NULL,
	`call_id` text NOT NULL,
	`user_id` text NOT NULL,
	`choice` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `call_feedback_unique` ON `call_feedback` (`call_id`,`user_id`);--> statement-breakpoint
CREATE TABLE `call_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`match_id` text NOT NULL,
	`caller_id` text NOT NULL,
	`recipient_id` text NOT NULL,
	`status` text DEFAULT 'invited' NOT NULL,
	`created_at` text NOT NULL,
	`expires_at` text NOT NULL,
	`ended_at` text
);
--> statement-breakpoint
CREATE INDEX `call_match_idx` ON `call_sessions` (`match_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `call_signals` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`call_id` text NOT NULL,
	`sender_id` text NOT NULL,
	`kind` text NOT NULL,
	`payload` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `call_signal_idx` ON `call_signals` (`call_id`,`id`);--> statement-breakpoint
CREATE TABLE `daily_batches` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`day` text NOT NULL,
	`profile_ids` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `daily_batch_unique` ON `daily_batches` (`user_id`,`day`);--> statement-breakpoint
CREATE TABLE `member_likes` (
	`id` text PRIMARY KEY NOT NULL,
	`sender_id` text NOT NULL,
	`recipient_id` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `member_like_unique` ON `member_likes` (`sender_id`,`recipient_id`);--> statement-breakpoint
CREATE INDEX `member_like_recipient_idx` ON `member_likes` (`recipient_id`);--> statement-breakpoint
CREATE TABLE `local_mail_outbox` (
	`id` text PRIMARY KEY NOT NULL,
	`recipient` text NOT NULL,
	`subject` text NOT NULL,
	`link` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `member_matches` (
	`id` text PRIMARY KEY NOT NULL,
	`user_a` text NOT NULL,
	`user_b` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` text NOT NULL,
	`ended_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `member_match_unique` ON `member_matches` (`user_a`,`user_b`);--> statement-breakpoint
CREATE INDEX `member_match_user_a_idx` ON `member_matches` (`user_a`);--> statement-breakpoint
CREATE INDEX `member_match_user_b_idx` ON `member_matches` (`user_b`);--> statement-breakpoint
CREATE TABLE `member_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`match_id` text NOT NULL,
	`sender_id` text NOT NULL,
	`text` text NOT NULL,
	`client_id` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `message_idempotency_unique` ON `member_messages` (`sender_id`,`client_id`);--> statement-breakpoint
CREATE INDEX `message_match_idx` ON `member_messages` (`match_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `moderation_audit` (
	`id` text PRIMARY KEY NOT NULL,
	`actor_id` text NOT NULL,
	`target_id` text NOT NULL,
	`action` text NOT NULL,
	`note` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `member_passes` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`target_id` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `member_pass_unique` ON `member_passes` (`user_id`,`target_id`);--> statement-breakpoint
CREATE TABLE `member_preferences` (
	`user_id` text PRIMARY KEY NOT NULL,
	`gender` text DEFAULT 'unspecified' NOT NULL,
	`interested_in` text DEFAULT '["everyone"]' NOT NULL,
	`min_age` integer DEFAULT 18 NOT NULL,
	`max_age` integer DEFAULT 100 NOT NULL,
	`visibility` integer DEFAULT 0 NOT NULL,
	`timezone` text DEFAULT 'Asia/Kolkata' NOT NULL,
	`city_only` integer DEFAULT 1 NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `profile_photos` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`object_key` text NOT NULL,
	`content_type` text NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `profile_photo_user_idx` ON `profile_photos` (`user_id`);--> statement-breakpoint
CREATE TABLE `member_reports` (
	`id` text PRIMARY KEY NOT NULL,
	`reporter_id` text NOT NULL,
	`target_id` text NOT NULL,
	`reason` text NOT NULL,
	`details` text NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`moderator_note` text,
	`created_at` text NOT NULL,
	`resolved_at` text
);
--> statement-breakpoint
CREATE INDEX `member_report_status_idx` ON `member_reports` (`status`);--> statement-breakpoint
CREATE TABLE `selfie_challenges` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`prompt` text NOT NULL,
	`expires_at` text NOT NULL,
	`used_at` text,
	`submission_id` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `selfie_challenge_user_idx` ON `selfie_challenges` (`user_id`);--> statement-breakpoint
ALTER TABLE `passports` ADD `selfie_challenge_id` text;--> statement-breakpoint
ALTER TABLE `passports` ADD `selfie_source` text;