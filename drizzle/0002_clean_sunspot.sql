CREATE TABLE `authIdentities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`provider` varchar(64) NOT NULL,
	`providerSubject` varchar(255) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `authIdentities_id` PRIMARY KEY(`id`),
	CONSTRAINT `auth_identity_provider_subject_unique` UNIQUE(`provider`,`providerSubject`)
);
--> statement-breakpoint
CREATE TABLE `authSessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`tokenHash` varchar(128) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `authSessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `authSessions_tokenHash_unique` UNIQUE(`tokenHash`)
);
--> statement-breakpoint
CREATE TABLE `passwordResetTokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`tokenHash` varchar(128) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`usedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `passwordResetTokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `password_reset_token_hash_unique` UNIQUE(`tokenHash`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `normalizedEmail` varchar(320);--> statement-breakpoint
ALTER TABLE `users` ADD `passwordHash` varchar(255);--> statement-breakpoint
UPDATE `users` SET `normalizedEmail` = LOWER(TRIM(`email`)) WHERE `email` IS NOT NULL AND (`normalizedEmail` IS NULL OR `normalizedEmail` = '');--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_normalizedEmail_unique` UNIQUE(`normalizedEmail`);--> statement-breakpoint
ALTER TABLE `authIdentities` ADD CONSTRAINT `authIdentities_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `authSessions` ADD CONSTRAINT `authSessions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `passwordResetTokens` ADD CONSTRAINT `passwordResetTokens_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `auth_sessions_user_expires_idx` ON `authSessions` (`userId`,`expiresAt`);
