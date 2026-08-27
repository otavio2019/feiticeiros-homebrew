CREATE TABLE IF NOT EXISTS `homebrewStructuredElements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`homebrewId` int NOT NULL,
	`moduleId` int NOT NULL,
	`legacyElementId` int,
	`homebrewElementType` enum('origem','voto','tecnica','feitico','arma','shikigami','mecanica','aptidao','especializacao','outro') NOT NULL,
	`name` varchar(160) NOT NULL,
	`description` text NOT NULL,
	`position` int NOT NULL DEFAULT 0,
	`isManual` boolean NOT NULL DEFAULT false,
	`structuredRuleSource` enum('official','homebrew','manual') NOT NULL DEFAULT 'homebrew',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `homebrewStructuredElements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `structuredAttributeBonuses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`elementId` int NOT NULL,
	`attribute` varchar(64) NOT NULL,
	`value` int NOT NULL,
	`position` int NOT NULL DEFAULT 0,
	CONSTRAINT `structuredAttributeBonuses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `structuredConditions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`elementId` int NOT NULL,
	`name` varchar(120) NOT NULL,
	`effect` text NOT NULL,
	`duration` varchar(120) NOT NULL DEFAULT '',
	`position` int NOT NULL DEFAULT 0,
	CONSTRAINT `structuredConditions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `structuredCosts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`elementId` int NOT NULL,
	`resource` varchar(64) NOT NULL,
	`amount` int NOT NULL,
	`details` text NOT NULL,
	`position` int NOT NULL DEFAULT 0,
	CONSTRAINT `structuredCosts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `structuredDamageProfiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`elementId` int NOT NULL,
	`dice` varchar(32) NOT NULL,
	`modifier` int NOT NULL DEFAULT 0,
	`damageType` varchar(64) NOT NULL,
	`scaling` varchar(255) NOT NULL DEFAULT '',
	`details` text NOT NULL,
	CONSTRAINT `structuredDamageProfiles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `structuredEffects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`elementId` int NOT NULL,
	`structuredEffectType` enum('text','bonus','penalty','condition','custom') NOT NULL DEFAULT 'text',
	`description` text NOT NULL,
	`valueNumber` int,
	`position` int NOT NULL DEFAULT 0,
	CONSTRAINT `structuredEffects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `structuredEvolutions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`elementId` int NOT NULL,
	`name` varchar(160) NOT NULL,
	`description` text NOT NULL,
	`position` int NOT NULL DEFAULT 0,
	`isManual` boolean NOT NULL DEFAULT false,
	`structuredRuleSource` enum('official','homebrew','manual') NOT NULL DEFAULT 'homebrew',
	CONSTRAINT `structuredEvolutions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `structuredRanges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`elementId` int NOT NULL,
	`range` int NOT NULL,
	`unit` varchar(32) NOT NULL,
	`area` varchar(255) NOT NULL DEFAULT '',
	`target` varchar(255) NOT NULL DEFAULT '',
	CONSTRAINT `structuredRanges_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `structuredRequirements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`elementId` int NOT NULL,
	`structuredRequirementType` enum('atributo','nivel','origem','voto','aptidao','especializacao','tecnica','item','condicao','custom') NOT NULL,
	`operator` varchar(16) NOT NULL DEFAULT 'gte',
	`valueText` varchar(255),
	`valueNumber` int,
	`position` int NOT NULL DEFAULT 0,
	CONSTRAINT `structuredRequirements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `structuredVowExchanges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`elementId` int NOT NULL,
	`structuredExchangeKind` enum('gain','loss') NOT NULL,
	`description` text NOT NULL,
	`valueNumber` int,
	`position` int NOT NULL DEFAULT 0,
	CONSTRAINT `structuredVowExchanges_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `structuredWeaponTechniqueLinks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`homebrewId` int NOT NULL,
	`weaponElementId` int NOT NULL,
	`techniqueElementId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `structuredWeaponTechniqueLinks_id` PRIMARY KEY(`id`),
	CONSTRAINT `weapon_technique_link_unique` UNIQUE(`weaponElementId`,`techniqueElementId`)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `structured_elements_homebrew_type_idx` ON `homebrewStructuredElements` (`homebrewId`,`homebrewElementType`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `structured_elements_module_position_idx` ON `homebrewStructuredElements` (`moduleId`,`position`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `attribute_bonuses_element_idx` ON `structuredAttributeBonuses` (`elementId`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `conditions_element_position_idx` ON `structuredConditions` (`elementId`,`position`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `costs_element_position_idx` ON `structuredCosts` (`elementId`,`position`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `damage_profiles_element_idx` ON `structuredDamageProfiles` (`elementId`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `effects_element_position_idx` ON `structuredEffects` (`elementId`,`position`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `evolutions_element_position_idx` ON `structuredEvolutions` (`elementId`,`position`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `ranges_element_idx` ON `structuredRanges` (`elementId`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `requirements_element_position_idx` ON `structuredRequirements` (`elementId`,`position`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `vow_exchanges_element_kind_idx` ON `structuredVowExchanges` (`elementId`,`structuredExchangeKind`,`position`);