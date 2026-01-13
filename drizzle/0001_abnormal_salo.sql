CREATE TABLE `extractions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`municipioCode` varchar(7) NOT NULL,
	`municipioName` varchar(255),
	`status` enum('processing','completed','failed') NOT NULL,
	`fileUrl` text,
	`fileKey` text,
	`totalSaude` int DEFAULT 0,
	`totalEducacao` int DEFAULT 0,
	`totalAssistencia` int DEFAULT 0,
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `extractions_id` PRIMARY KEY(`id`)
);
