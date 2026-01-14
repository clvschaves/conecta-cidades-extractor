CREATE TABLE `municipios` (
	`id` int AUTO_INCREMENT NOT NULL,
	`codigoIbge` varchar(7) NOT NULL,
	`nome` varchar(255) NOT NULL,
	`uf` varchar(2) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `municipios_id` PRIMARY KEY(`id`),
	CONSTRAINT `municipios_codigoIbge_unique` UNIQUE(`codigoIbge`)
);
