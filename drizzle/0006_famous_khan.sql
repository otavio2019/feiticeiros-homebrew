CREATE TABLE `shikigamiAbilities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sheetId` int NOT NULL,
	`clientId` varchar(64) NOT NULL,
	`kind` enum('acao','caracteristica') NOT NULL,
	`name` varchar(160) NOT NULL DEFAULT '',
	`description` text NOT NULL,
	`position` int NOT NULL DEFAULT 0,
	CONSTRAINT `shikigamiAbilities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `shikigamiAttributes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sheetId` int NOT NULL,
	`attribute` enum('forca','destreza','constituicao','inteligencia','sabedoria','carisma') NOT NULL,
	`value` int NOT NULL,
	CONSTRAINT `shikigamiAttributes_id` PRIMARY KEY(`id`),
	CONSTRAINT `shikigami_attributes_sheet_attribute_unique` UNIQUE(`sheetId`,`attribute`)
);
--> statement-breakpoint
CREATE TABLE `shikigamiOptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sheetId` int NOT NULL,
	`group` enum('controlador','caracteristica') NOT NULL,
	`code` varchar(64) NOT NULL,
	`enabled` boolean NOT NULL DEFAULT false,
	CONSTRAINT `shikigamiOptions_id` PRIMARY KEY(`id`),
	CONSTRAINT `shikigami_options_sheet_group_code_unique` UNIQUE(`sheetId`,`group`,`code`)
);
--> statement-breakpoint
CREATE TABLE `shikigamiSheets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`homebrewId` int NOT NULL,
	`moduleId` int NOT NULL,
	`name` varchar(160) NOT NULL DEFAULT '',
	`type` enum('comum','tecnica','manipulacao') NOT NULL DEFAULT 'comum',
	`grade` enum('quarto','terceiro','segundo','primeiro','especial') NOT NULL DEFAULT 'quarto',
	`userLevel` int NOT NULL DEFAULT 1,
	`mastery` int NOT NULL DEFAULT 2,
	`lostHealth` int NOT NULL DEFAULT 0,
	`healedHealth` int NOT NULL DEFAULT 0,
	`movementAttribute` enum('forca','destreza','constituicao','inteligencia','sabedoria','carisma') NOT NULL DEFAULT 'destreza',
	`defenseAttribute` enum('forca','destreza','constituicao','inteligencia','sabedoria','carisma') NOT NULL DEFAULT 'destreza',
	`bonusSkillA` enum('feiticaria','investigacao','historia','medicina','religiao','ocultismo','prestidigitacao','percepcao','intuicao','furtividade','oficio','reflexos','fortitude','vontade','astucia','integridade') NOT NULL DEFAULT 'feiticaria',
	`bonusSkillB` enum('feiticaria','investigacao','historia','medicina','religiao','ocultismo','prestidigitacao','percepcao','intuicao','furtividade','oficio','reflexos','fortitude','vontade','astucia','integridade') NOT NULL DEFAULT 'investigacao',
	`size` enum('minusculo','pequeno','medio','grande','enorme','colossal') NOT NULL DEFAULT 'medio',
	`notes` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `shikigamiSheets_id` PRIMARY KEY(`id`),
	CONSTRAINT `shikigami_sheets_homebrew_unique` UNIQUE(`homebrewId`),
	CONSTRAINT `shikigami_sheets_module_unique` UNIQUE(`moduleId`)
);
--> statement-breakpoint
CREATE TABLE `shikigamiSkills` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sheetId` int NOT NULL,
	`skill` enum('feiticaria','investigacao','historia','medicina','religiao','ocultismo','prestidigitacao','percepcao','intuicao','furtividade','oficio','reflexos','fortitude','vontade','astucia','integridade') NOT NULL,
	`otherBonus` int NOT NULL DEFAULT 0,
	`mastery` boolean NOT NULL DEFAULT false,
	`specialty` boolean NOT NULL DEFAULT false,
	CONSTRAINT `shikigamiSkills_id` PRIMARY KEY(`id`),
	CONSTRAINT `shikigami_skills_sheet_skill_unique` UNIQUE(`sheetId`,`skill`)
);
--> statement-breakpoint
ALTER TABLE `shikigamiAbilities` ADD CONSTRAINT `shikigamiAbilities_sheetId_shikigamiSheets_id_fk` FOREIGN KEY (`sheetId`) REFERENCES `shikigamiSheets`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `shikigamiAttributes` ADD CONSTRAINT `shikigamiAttributes_sheetId_shikigamiSheets_id_fk` FOREIGN KEY (`sheetId`) REFERENCES `shikigamiSheets`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `shikigamiOptions` ADD CONSTRAINT `shikigamiOptions_sheetId_shikigamiSheets_id_fk` FOREIGN KEY (`sheetId`) REFERENCES `shikigamiSheets`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `shikigamiSheets` ADD CONSTRAINT `shikigamiSheets_homebrewId_homebrews_id_fk` FOREIGN KEY (`homebrewId`) REFERENCES `homebrews`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `shikigamiSheets` ADD CONSTRAINT `shikigamiSheets_moduleId_homebrewModules_id_fk` FOREIGN KEY (`moduleId`) REFERENCES `homebrewModules`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `shikigamiSkills` ADD CONSTRAINT `shikigamiSkills_sheetId_shikigamiSheets_id_fk` FOREIGN KEY (`sheetId`) REFERENCES `shikigamiSheets`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `shikigami_abilities_sheet_position_idx` ON `shikigamiAbilities` (`sheetId`,`position`);