-- AlterTable
ALTER TABLE "user_models" ADD COLUMN     "supports_deep_thinking" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "supports_vision" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "supports_web_search" BOOLEAN NOT NULL DEFAULT false;
