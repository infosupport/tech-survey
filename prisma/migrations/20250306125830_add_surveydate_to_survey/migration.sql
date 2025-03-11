/*
  Warnings:

  - Added the required column `surveyDate` to the `Survey` table without a default value. This is not possible if the table is not empty.

*/

-- Add the surveyDate column as nullable
ALTER TABLE "Survey" ADD COLUMN "surveyDate" DATE NULL;

-- Update the 2024 survey to have a surveyDate
UPDATE "Survey" SET "surveyDate" = '2024-01-01' WHERE "surveyDate" IS NULL;

-- Alter the surveyDate column to be non-nullable
ALTER TABLE "Survey" ALTER COLUMN "surveyDate" SET NOT NULL;