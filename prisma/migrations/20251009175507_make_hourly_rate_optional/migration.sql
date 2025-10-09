-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_teachers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "subdomain" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "title" TEXT,
    "bio" TEXT,
    "hourly_rate" REAL,
    "profile_image" TEXT,
    "phone" TEXT,
    "color_scheme" TEXT NOT NULL DEFAULT 'default',
    "email_verified" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);
INSERT INTO "new_teachers" ("bio", "color_scheme", "created_at", "email", "email_verified", "hourly_rate", "id", "name", "password_hash", "phone", "profile_image", "subdomain", "title", "updated_at") SELECT "bio", "color_scheme", "created_at", "email", "email_verified", "hourly_rate", "id", "name", "password_hash", "phone", "profile_image", "subdomain", "title", "updated_at" FROM "teachers";
DROP TABLE "teachers";
ALTER TABLE "new_teachers" RENAME TO "teachers";
CREATE UNIQUE INDEX "teachers_subdomain_key" ON "teachers"("subdomain");
CREATE UNIQUE INDEX "teachers_email_key" ON "teachers"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
