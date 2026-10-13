CREATE TABLE `forms` (
	`id` text PRIMARY KEY,
	`owner_id` text NOT NULL,
	`slug` text NOT NULL UNIQUE,
	`draft` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`active_publication_id` text,
	`revision` integer DEFAULT 1 NOT NULL,
	`published_revision` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	CONSTRAINT `fk_forms_owner_id_user_id_fk` FOREIGN KEY (`owner_id`) REFERENCES `user`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `publications` (
	`id` text PRIMARY KEY,
	`form_id` text NOT NULL,
	`document` text NOT NULL,
	`created_at` integer NOT NULL,
	CONSTRAINT `fk_publications_form_id_forms_id_fk` FOREIGN KEY (`form_id`) REFERENCES `forms`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `submissions` (
	`id` text PRIMARY KEY,
	`form_id` text NOT NULL,
	`publication_id` text NOT NULL,
	`answers` text NOT NULL,
	`created_at` integer NOT NULL,
	CONSTRAINT `fk_submissions_form_id_forms_id_fk` FOREIGN KEY (`form_id`) REFERENCES `forms`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_submissions_publication_id_publications_id_fk` FOREIGN KEY (`publication_id`) REFERENCES `publications`(`id`) ON DELETE CASCADE
);
