-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('user', 'admin');

-- CreateEnum
CREATE TYPE "public"."StoryStatus" AS ENUM ('ongoing', 'finished', 'postpone', 'upcoming');

-- CreateEnum
CREATE TYPE "public"."StoryType" AS ENUM ('manga', 'light_novel', 'web_novel', 'anime');

-- CreateEnum
CREATE TYPE "public"."StoryNodeType" AS ENUM ('chapter', 'arc', 'volume');

-- CreateEnum
CREATE TYPE "public"."Gender" AS ENUM ('male', 'female', 'other');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "gender" "public"."Gender" DEFAULT 'other',
    "join_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "role" "public"."Role" NOT NULL DEFAULT 'user',
    "avatar_id" UUID,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Story" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "nation" TEXT,
    "view" INTEGER NOT NULL DEFAULT 0,
    "type" "public"."StoryType" NOT NULL,
    "status" "public"."StoryStatus" NOT NULL DEFAULT 'ongoing',
    "next_chapter_in" TIMESTAMP(3),
    "number_of_chapter" INTEGER,
    "cover_art_id" UUID,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Story_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."StoryNode" (
    "id" UUID NOT NULL,
    "story_id" UUID,
    "parent_id" UUID,
    "title" TEXT NOT NULL,
    "type" "public"."StoryNodeType" NOT NULL,
    "order_index" INTEGER,
    "view" INTEGER NOT NULL DEFAULT 0,
    "update_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "content" JSONB,
    "plain_text" TEXT,
    "search_vector" tsvector NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "StoryNode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Image" (
    "id" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Image_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Author" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Author_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Story_Author" (
    "story_id" UUID NOT NULL,
    "author_id" UUID NOT NULL,

    CONSTRAINT "Story_Author_pkey" PRIMARY KEY ("story_id","author_id")
);

-- CreateTable
CREATE TABLE "public"."ReadingHistory" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "story_id" UUID NOT NULL,
    "story_node_id" UUID NOT NULL,
    "read_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_position" JSONB,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ReadingHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FavouriteStory" (
    "user_id" UUID NOT NULL,
    "story_id" UUID NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "FavouriteStory_pkey" PRIMARY KEY ("user_id","story_id")
);

-- CreateTable
CREATE TABLE "public"."Genre" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Genre_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Story_Genre" (
    "story_id" UUID NOT NULL,
    "genre_id" UUID NOT NULL,

    CONSTRAINT "Story_Genre_pkey" PRIMARY KEY ("story_id","genre_id")
);

-- CreateTable
CREATE TABLE "public"."Rating" (
    "user_id" UUID NOT NULL,
    "story_id" UUID NOT NULL,
    "rating" DOUBLE PRECISION NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Rating_pkey" PRIMARY KEY ("user_id","story_id")
);

-- CreateTable
CREATE TABLE "public"."Comment" (
    "id" UUID NOT NULL,
    "story_id" UUID NOT NULL,
    "story_node_id" UUID,
    "user_id" UUID NOT NULL,
    "message" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Story_title_key" ON "public"."Story"("title");

-- CreateIndex
CREATE UNIQUE INDEX "StoryNode_parent_id_order_index_key" ON "public"."StoryNode"("parent_id", "order_index");

-- AddForeignKey
ALTER TABLE "public"."User" ADD CONSTRAINT "User_avatar_id_fkey" FOREIGN KEY ("avatar_id") REFERENCES "public"."Image"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Story" ADD CONSTRAINT "Story_cover_art_id_fkey" FOREIGN KEY ("cover_art_id") REFERENCES "public"."Image"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StoryNode" ADD CONSTRAINT "StoryNode_story_id_fkey" FOREIGN KEY ("story_id") REFERENCES "public"."Story"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StoryNode" ADD CONSTRAINT "StoryNode_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."StoryNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Story_Author" ADD CONSTRAINT "Story_Author_story_id_fkey" FOREIGN KEY ("story_id") REFERENCES "public"."Story"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Story_Author" ADD CONSTRAINT "Story_Author_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."Author"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ReadingHistory" ADD CONSTRAINT "ReadingHistory_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ReadingHistory" ADD CONSTRAINT "ReadingHistory_story_id_fkey" FOREIGN KEY ("story_id") REFERENCES "public"."Story"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ReadingHistory" ADD CONSTRAINT "ReadingHistory_story_node_id_fkey" FOREIGN KEY ("story_node_id") REFERENCES "public"."StoryNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FavouriteStory" ADD CONSTRAINT "FavouriteStory_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FavouriteStory" ADD CONSTRAINT "FavouriteStory_story_id_fkey" FOREIGN KEY ("story_id") REFERENCES "public"."Story"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Story_Genre" ADD CONSTRAINT "Story_Genre_story_id_fkey" FOREIGN KEY ("story_id") REFERENCES "public"."Story"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Story_Genre" ADD CONSTRAINT "Story_Genre_genre_id_fkey" FOREIGN KEY ("genre_id") REFERENCES "public"."Genre"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Rating" ADD CONSTRAINT "Rating_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Rating" ADD CONSTRAINT "Rating_story_id_fkey" FOREIGN KEY ("story_id") REFERENCES "public"."Story"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Comment" ADD CONSTRAINT "Comment_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Comment" ADD CONSTRAINT "Comment_story_id_fkey" FOREIGN KEY ("story_id") REFERENCES "public"."Story"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Comment" ADD CONSTRAINT "Comment_story_node_id_fkey" FOREIGN KEY ("story_node_id") REFERENCES "public"."StoryNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;
