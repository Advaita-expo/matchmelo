CREATE TABLE `passport_reviews` (
	`id` text PRIMARY KEY NOT NULL,
	`passport_id` text NOT NULL,
	`reviewer_id` text NOT NULL,
	`decision` text NOT NULL,
	`note` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`passport_id`) REFERENCES `passports`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `passports` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`age` integer NOT NULL,
	`city` text NOT NULL,
	`area` text NOT NULL,
	`intent` text NOT NULL,
	`bio` text NOT NULL,
	`interests` text NOT NULL,
	`adult_declared_at` text NOT NULL,
	`policy_accepted_at` text NOT NULL,
	`policy_version` text NOT NULL,
	`selfie_key` text,
	`selfie_submitted_at` text,
	`review_status` text DEFAULT 'not_submitted' NOT NULL,
	`review_note` text,
	`reviewed_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `passports_user_id_unique` ON `passports` (`user_id`);