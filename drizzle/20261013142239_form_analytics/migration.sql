CREATE TABLE `form_visits` (
	`form_id` text NOT NULL,
	`session_id` text NOT NULL,
	`viewed_at` integer NOT NULL,
	`started_at` integer,
	CONSTRAINT `form_visits_pk` PRIMARY KEY(`form_id`, `session_id`),
	CONSTRAINT `fk_form_visits_form_id_forms_id_fk` FOREIGN KEY (`form_id`) REFERENCES `forms`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
ALTER TABLE `forms` ADD `accepting` integer DEFAULT true NOT NULL;--> statement-breakpoint
CREATE INDEX `form_visits_form_viewed_idx` ON `form_visits` (`form_id`,`viewed_at`);