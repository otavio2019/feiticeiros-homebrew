CREATE TABLE `homebrewElements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`homebrewId` int NOT NULL,
	`moduleId` int NOT NULL,
	`parentElementId` int,
	`homebrewElementType` enum('origem','voto','tecnica','feitico','arma','shikigami','mecanica','aptidao','especializacao','outro') NOT NULL,
	`name` varchar(160) NOT NULL,
	`position` int NOT NULL DEFAULT 0,
	`isManual` boolean NOT NULL DEFAULT false,
	`data` json NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `homebrewElements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `homebrewImages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`homebrewId` int NOT NULL,
	`moduleId` int,
	`elementId` int,
	`imageSource` enum('url','upload') NOT NULL,
	`url` text NOT NULL,
	`storageKey` varchar(255),
	`altText` varchar(240),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `homebrewImages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `homebrewModules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`homebrewId` int NOT NULL,
	`homebrewModuleType` enum('origem','votos','tecnicas','armas','shikigami','mecanicas','aptidoes','especializacoes','outros') NOT NULL,
	`position` int NOT NULL DEFAULT 0,
	`enabled` boolean NOT NULL DEFAULT true,
	`data` json NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `homebrewModules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `homebrews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`title` varchar(160) NOT NULL,
	`summary` text NOT NULL,
	`shareId` varchar(32) NOT NULL,
	`homebrewVisibility` enum('private','unlisted','public') NOT NULL DEFAULT 'private',
	`homebrewStatus` enum('draft','published') NOT NULL DEFAULT 'draft',
	`characterLevel` int NOT NULL DEFAULT 1,
	`manualMode` boolean NOT NULL DEFAULT false,
	`coverImageUrl` text,
	`data` json NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `homebrews_id` PRIMARY KEY(`id`),
	CONSTRAINT `homebrews_share_id_unique` UNIQUE(`shareId`)
);
--> statement-breakpoint
ALTER TABLE `homebrewElements` ADD CONSTRAINT `homebrewElements_homebrewId_homebrews_id_fk` FOREIGN KEY (`homebrewId`) REFERENCES `homebrews`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `homebrewElements` ADD CONSTRAINT `homebrewElements_moduleId_homebrewModules_id_fk` FOREIGN KEY (`moduleId`) REFERENCES `homebrewModules`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `homebrewImages` ADD CONSTRAINT `homebrewImages_homebrewId_homebrews_id_fk` FOREIGN KEY (`homebrewId`) REFERENCES `homebrews`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `homebrewModules` ADD CONSTRAINT `homebrewModules_homebrewId_homebrews_id_fk` FOREIGN KEY (`homebrewId`) REFERENCES `homebrews`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `homebrews` ADD CONSTRAINT `homebrews_ownerId_users_id_fk` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `homebrew_elements_module_position_idx` ON `homebrewElements` (`moduleId`,`position`);--> statement-breakpoint
CREATE INDEX `homebrew_elements_homebrew_type_idx` ON `homebrewElements` (`homebrewId`,`homebrewElementType`);--> statement-breakpoint
CREATE INDEX `homebrew_images_homebrew_idx` ON `homebrewImages` (`homebrewId`);--> statement-breakpoint
CREATE INDEX `homebrew_modules_homebrew_position_idx` ON `homebrewModules` (`homebrewId`,`position`);--> statement-breakpoint
CREATE INDEX `homebrews_owner_updated_idx` ON `homebrews` (`ownerId`,`updatedAt`);