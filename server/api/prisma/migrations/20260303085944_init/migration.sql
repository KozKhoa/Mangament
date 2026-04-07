-- CreateEnum
CREATE TYPE "StoryNodeContentType" AS ENUM ('image', 'text', 'header', 'title');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('user', 'admin');

-- CreateEnum
CREATE TYPE "StoryStatus" AS ENUM ('ongoing', 'finished', 'postpone', 'upcoming');

-- CreateEnum
CREATE TYPE "StoryType" AS ENUM ('manga', 'light_novel', 'web_novel', 'anime');

-- CreateEnum
CREATE TYPE "StoryNodeType" AS ENUM ('chapter', 'arc', 'volume');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('male', 'female', 'other');

-- CreateEnum
CREATE TYPE "Genre" AS ENUM ('action', 'adventure', 'comedy', 'crime', 'cyberpunk', 'dark_fantasy', 'detective', 'drama', 'dystopian_fiction', 'ecchi', 'fairy_tale', 'fantasy', 'fiction', 'gekiga', 'gothic_fiction', 'harem', 'high_fantasy', 'historical', 'historical_fiction', 'horror', 'isekai', 'josei', 'kodomo', 'literary_fiction', 'low_fantasy', 'magical_realism', 'martial_arts', 'mecha', 'mystery', 'parody', 'post_apocalyptic', 'psychology', 'romance', 'science_fiction', 'seinen', 'shojo', 'shonen', 'shoujo_ai', 'shounen_ai', 'slice_of_life', 'space_opera', 'sport', 'steampunk', 'supernatural', 'survival', 'thriller', 'tragedy', 'yaoi', 'yuri');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "gender" "Gender" DEFAULT 'other',
    "birthday" TIMESTAMP(3),
    "join_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "role" "Role" NOT NULL DEFAULT 'user',
    "nation_id" UUID,
    "avatar_id" UUID,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "is_banned" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Story" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "view" INTEGER NOT NULL DEFAULT 0,
    "star" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "rating_count" INTEGER NOT NULL DEFAULT 0,
    "type" "StoryType" NOT NULL,
    "status" "StoryStatus" NOT NULL DEFAULT 'ongoing',
    "next_chapter_in" TIMESTAMP(3),
    "number_of_children" INTEGER NOT NULL DEFAULT 0,
    "cover_art_id" UUID,
    "nation_id" UUID,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "is_actived" BOOLEAN NOT NULL DEFAULT true,
    "poster_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "summary" TEXT,

    CONSTRAINT "Story_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoryNode" (
    "id" UUID NOT NULL,
    "story_id" UUID,
    "parent_id" UUID,
    "title" TEXT,
    "type" "StoryNodeType" NOT NULL,
    "order_index" REAL,
    "view" INTEGER NOT NULL DEFAULT 0,
    "number_of_children" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "plain_text" TEXT,
    "search_vector" tsvector,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "poster_id" UUID,

    CONSTRAINT "StoryNode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoryNodeContent" (
    "id" UUID NOT NULL,
    "story_node_id" UUID NOT NULL,
    "type" "StoryNodeContentType" NOT NULL DEFAULT 'text',
    "order_index" INTEGER NOT NULL,
    "content" TEXT,
    "image_id" UUID,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StoryNodeContent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Image" (
    "id" UUID NOT NULL,
    "url" TEXT,
    "key" TEXT,
    "public_id" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Image_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Author" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "nation_id" UUID,

    CONSTRAINT "Author_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Story_Author" (
    "story_id" UUID NOT NULL,
    "author_id" UUID NOT NULL,

    CONSTRAINT "Story_Author_pkey" PRIMARY KEY ("story_id","author_id")
);

-- CreateTable
CREATE TABLE "ReadingHistory" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "story_id" UUID NOT NULL,
    "story_node_id" UUID NOT NULL,
    "last_position" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ReadingHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FavouriteStory" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "story_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FavouriteStory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Nation" (
    "id" UUID NOT NULL,
    "flag_image_id" UUID,
    "flag_icon" TEXT,
    "name" TEXT NOT NULL,

    CONSTRAINT "Nation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Story_Genre" (
    "story_id" UUID NOT NULL,
    "genre" "Genre" NOT NULL,

    CONSTRAINT "Story_Genre_pkey" PRIMARY KEY ("story_id","genre")
);

-- CreateTable
CREATE TABLE "Rating" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "story_id" UUID NOT NULL,
    "star" INTEGER NOT NULL DEFAULT 0,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Rating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" UUID NOT NULL,
    "parent_id" UUID,
    "story_id" UUID NOT NULL,
    "story_node_id" UUID,
    "user_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "user_id" UUID NOT NULL,
    "token" TEXT NOT NULL,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("user_id","token")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Story_title_key" ON "Story"("title");

-- CreateIndex
CREATE UNIQUE INDEX "Image_url_key" ON "Image"("url");

-- CreateIndex
CREATE UNIQUE INDEX "Image_key_key" ON "Image"("key");

-- CreateIndex
CREATE UNIQUE INDEX "Image_public_id_key" ON "Image"("public_id");

-- CreateIndex
CREATE UNIQUE INDEX "FavouriteStory_user_id_story_id_key" ON "FavouriteStory"("user_id", "story_id");

-- CreateIndex
CREATE UNIQUE INDEX "Nation_name_key" ON "Nation"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Rating_user_id_story_id_key" ON "Rating"("user_id", "story_id");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_token_key" ON "RefreshToken"("token");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_avatar_id_fkey" FOREIGN KEY ("avatar_id") REFERENCES "Image"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_nation_id_fkey" FOREIGN KEY ("nation_id") REFERENCES "Nation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Story" ADD CONSTRAINT "Story_cover_art_id_fkey" FOREIGN KEY ("cover_art_id") REFERENCES "Image"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Story" ADD CONSTRAINT "Story_poster_id_fkey" FOREIGN KEY ("poster_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Story" ADD CONSTRAINT "Story_nation_id_fkey" FOREIGN KEY ("nation_id") REFERENCES "Nation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryNode" ADD CONSTRAINT "StoryNode_story_id_fkey" FOREIGN KEY ("story_id") REFERENCES "Story"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryNode" ADD CONSTRAINT "StoryNode_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "StoryNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryNode" ADD CONSTRAINT "StoryNode_poster_id_fkey" FOREIGN KEY ("poster_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryNodeContent" ADD CONSTRAINT "StoryNodeContent_story_node_id_fkey" FOREIGN KEY ("story_node_id") REFERENCES "StoryNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryNodeContent" ADD CONSTRAINT "StoryNodeContent_image_id_fkey" FOREIGN KEY ("image_id") REFERENCES "Image"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Author" ADD CONSTRAINT "Author_nation_id_fkey" FOREIGN KEY ("nation_id") REFERENCES "Nation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Story_Author" ADD CONSTRAINT "Story_Author_story_id_fkey" FOREIGN KEY ("story_id") REFERENCES "Story"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Story_Author" ADD CONSTRAINT "Story_Author_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "Author"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadingHistory" ADD CONSTRAINT "ReadingHistory_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadingHistory" ADD CONSTRAINT "ReadingHistory_story_id_fkey" FOREIGN KEY ("story_id") REFERENCES "Story"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadingHistory" ADD CONSTRAINT "ReadingHistory_story_node_id_fkey" FOREIGN KEY ("story_node_id") REFERENCES "StoryNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FavouriteStory" ADD CONSTRAINT "FavouriteStory_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FavouriteStory" ADD CONSTRAINT "FavouriteStory_story_id_fkey" FOREIGN KEY ("story_id") REFERENCES "Story"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Nation" ADD CONSTRAINT "Nation_flag_image_id_fkey" FOREIGN KEY ("flag_image_id") REFERENCES "Image"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Story_Genre" ADD CONSTRAINT "Story_Genre_story_id_fkey" FOREIGN KEY ("story_id") REFERENCES "Story"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_story_id_fkey" FOREIGN KEY ("story_id") REFERENCES "Story"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_story_id_fkey" FOREIGN KEY ("story_id") REFERENCES "Story"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_story_node_id_fkey" FOREIGN KEY ("story_node_id") REFERENCES "StoryNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
