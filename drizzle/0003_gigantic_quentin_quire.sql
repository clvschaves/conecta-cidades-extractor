CREATE TABLE `equipamentosAssistencia` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tipo` varchar(50) NOT NULL,
	`nome` varchar(500) NOT NULL,
	`municipio` varchar(255) NOT NULL,
	`endereco` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `equipamentosAssistencia_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `escolas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`codigoInep` varchar(20) NOT NULL,
	`nome` varchar(500) NOT NULL,
	`codigoMunicipio` varchar(7) NOT NULL,
	`municipio` varchar(255) NOT NULL,
	`uf` varchar(2) NOT NULL,
	`restricaoAtendimento` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `escolas_id` PRIMARY KEY(`id`),
	CONSTRAINT `escolas_codigoInep_unique` UNIQUE(`codigoInep`)
);
