/*
  Warnings:

  - A unique constraint covering the columns `[userId]` on the table `CommunicationPreference` will be added. If there are existing duplicate values, this will fail.

*/
-- Find all users which have more than 1 entry in CommunicationPreference
WITH usersWithMultipleCommunicationPreferences AS (
    SELECT "userId"
    FROM "CommunicationPreference"
    GROUP BY "userId"
    HAVING COUNT(*) > 1
),
    -- This returns rows userId - Method. With a row for each method found
     unnestedMethods AS (
         SELECT "userId", unnest("methods") AS method
         FROM "CommunicationPreference"
         WHERE "userId" IN (SELECT "userId" FROM usersWithMultipleCommunicationPreferences)
     )
UPDATE "CommunicationPreference" cp
-- Combine all the method rows into one row, where each method appears only once
SET "methods" = (
    SELECT array_agg(DISTINCT method)
    FROM unnestedMethods
    WHERE "userId" = cp."userId"
)
-- Only do this for users with more than one preference
WHERE "userId" IN (
    SELECT "userId"
    FROM usersWithMultipleCommunicationPreferences
);

-- Now delete all rows, except the first, for each user
DELETE FROM "CommunicationPreference"
WHERE ctid NOT IN (
    SELECT min(ctid)
    FROM "CommunicationPreference"
    GROUP BY "userId"
);

-- CreateIndex
CREATE UNIQUE INDEX "CommunicationPreference_userId_key" ON "CommunicationPreference"("userId");
