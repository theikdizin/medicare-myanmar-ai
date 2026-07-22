CREATE TABLE `user_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`fullName` varchar(255),
	`dateOfBirth` varchar(20),
	`gender` enum('male','female','other','prefer_not_to_say'),
	`bloodType` varchar(10),
	`phone` varchar(30),
	`address` text,
	`nationality` varchar(100),
	`occupation` varchar(255),
	`allergies` text,
	`currentMedications` text,
	`chronicConditions` text,
	`pastSurgeries` text,
	`familyHistory` text,
	`medicalNotes` text,
	`emergencyContactName` varchar(255),
	`emergencyContactPhone` varchar(30),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_profiles_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE INDEX `idx_profiles_user` ON `user_profiles` (`userId`);