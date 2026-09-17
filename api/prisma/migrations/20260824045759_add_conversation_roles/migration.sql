-- CreateEnum
CREATE TYPE "ConversationParticipantRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER');

-- AlterTable
ALTER TABLE "ConversationParticipant" ADD COLUMN     "role" "ConversationParticipantRole" NOT NULL DEFAULT 'MEMBER';
