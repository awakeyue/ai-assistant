/*
  Warnings:

  - You are about to drop the column `supports_deep_thinking` on the `user_models` table. All the data in the column will be lost.
  - You are about to drop the column `supports_web_search` on the `user_models` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "user_models" DROP COLUMN "supports_deep_thinking",
DROP COLUMN "supports_web_search";
