ALTER TABLE `homebrewElements` MODIFY COLUMN `homebrewElementType` enum('origem','voto','tecnica','feitico','arma','shikigami','mecanica','aptidao','especializacao','outro','caracteristica','talento','evolucao','propriedade') NOT NULL;--> statement-breakpoint
ALTER TABLE `homebrewStructuredElements` MODIFY COLUMN `homebrewElementType` enum('origem','voto','tecnica','feitico','arma','shikigami','mecanica','aptidao','especializacao','outro','caracteristica','talento','evolucao','propriedade') NOT NULL;--> statement-breakpoint
ALTER TABLE `homebrewStructuredElements` MODIFY COLUMN `description` text NOT NULL;--> statement-breakpoint
ALTER TABLE `structuredCosts` MODIFY COLUMN `details` text NOT NULL;--> statement-breakpoint
ALTER TABLE `structuredDamageProfiles` MODIFY COLUMN `details` text NOT NULL;--> statement-breakpoint
ALTER TABLE `structuredEvolutions` MODIFY COLUMN `description` text NOT NULL;--> statement-breakpoint
ALTER TABLE `homebrewStructuredElements` ADD COLUMN IF NOT EXISTS `parentElementId` int;--> statement-breakpoint
ALTER TABLE `homebrewStructuredElements` ADD CONSTRAINT `structured_parent_fk` FOREIGN KEY (`parentElementId`) REFERENCES `homebrewStructuredElements`(`id`) ON DELETE no action ON UPDATE no action;
