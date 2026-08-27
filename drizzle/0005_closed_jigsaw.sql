CREATE TABLE `structuredEvolutionUnlocks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`evolutionElementId` int NOT NULL,
	`unlockedElementId` int NOT NULL,
	CONSTRAINT `structuredEvolutionUnlocks_id` PRIMARY KEY(`id`),
	CONSTRAINT `evolution_unlock_unique` UNIQUE(`evolutionElementId`,`unlockedElementId`)
);
--> statement-breakpoint
ALTER TABLE `homebrewElements` MODIFY COLUMN `homebrewElementType` enum('origem','voto','tecnica','feitico','arma','shikigami','mecanica','aptidao','especializacao','outro','caracteristica','talento','evolucao','penalidade','propriedade') NOT NULL;--> statement-breakpoint
ALTER TABLE `homebrewStructuredElements` MODIFY COLUMN `homebrewElementType` enum('origem','voto','tecnica','feitico','arma','shikigami','mecanica','aptidao','especializacao','outro','caracteristica','talento','evolucao','penalidade','propriedade') NOT NULL;--> statement-breakpoint
ALTER TABLE `structuredEvolutionUnlocks` ADD CONSTRAINT `evolution_unlock_evolution_fk` FOREIGN KEY (`evolutionElementId`) REFERENCES `homebrewStructuredElements`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `structuredEvolutionUnlocks` ADD CONSTRAINT `evolution_unlock_target_fk` FOREIGN KEY (`unlockedElementId`) REFERENCES `homebrewStructuredElements`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `evolution_unlock_evolution_idx` ON `structuredEvolutionUnlocks` (`evolutionElementId`);
