-- USER TABLE
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- for text search optimization
CREATE EXTENSION IF NOT EXISTS "uuid-ossp"; -- for UUID generation

CREATE TABLE Users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), 
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    password TEXT NOT NULL,
    gender TEXT CHECK (gender IN ('male', 'female', 'other')),
    join_date TIMESTAMPTZ DEFAULT NOW(),
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin'))
);
-- STORY TABLE
CREATE TABLE Story (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    nation TEXT,
    view INT DEFAULT 0,
    type TEXT NOT NULL CHECK (type IN ('manga', 'light novel', 'web novel', 'comic', 'other', 'anime', 'manhwa', 'manhua')),
    status TEXT NOT NULL CHECK (status IN ('ongoing', 'postpone', 'finished', 'upcoming')),
    next_chapter_in TIMESTAMPTZ,
    number_of_chapter INT DEFAULT 0,
    cover_art UUID
);
-- STORY NODE TABLE (chapter/volume/arc/etc.)
CREATE TABLE StoryNode (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    story_id UUID,
    parent_id UUID,
    title TEXT NOT NULL,
    type TEXT CHECK (type IN ('arc','volume','chapter','episode','bonus','epilogue','prologue')),
    order_index INT,
    view INT DEFAULT 0,
    update_at TIMESTAMPTZ DEFAULT NOW(),
    content JSONB,
    plain_text TEXT,
    search_vector TSVECTOR,
    UNIQUE (parent_id, order_index) -- ensure unique order_index within a its parent
);
-- IMAGE TABLE
CREATE TABLE Image (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    url TEXT NOT NULL,
    width INT,
    height INT
);
-- READING HISTORY
CREATE TABLE ReadingHistory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), 
    user_id UUID,
    story_id UUID,
    story_node_id UUID,
    reading_at TIMESTAMPTZ DEFAULT NOW(),
    last_position JSONB
);
-- GENRE
CREATE TABLE Genre (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL
);
-- STORY_GENRE (instead of Genre_Manga)
CREATE TABLE Story_Genre (
    genre_id UUID,
    story_id UUID,
    PRIMARY KEY (genre_id, story_id)
);
-- RATING
CREATE TABLE Rating (
    story_id UUID,
    user_id UUID,
    rating NUMERIC(2,1) CHECK (rating >= 0 AND rating <= 5),
    message TEXT,

    PRIMARY KEY (story_id, user_id)
);
-- FAVORITE
CREATE TABLE FavouriteStory (
    user_id UUID,
    story_id UUID,  
    PRIMARY KEY (user_id, story_id)
);
-- COMMENT
CREATE TABLE Review (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    story_id UUID,
    story_node_id UUID,
    message TEXT NOT NULL,  
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE Story ADD FOREIGN KEY (cover_art) REFERENCES Image(id) ON DELETE SET NULL;
ALTER TABLE StoryNode ADD FOREIGN KEY (story_id) REFERENCES Story(id) ON DELETE CASCADE; -- StoryNode belongs to a Story, if Story is deleted, delete its StoryNodes too
ALTER TABLE StoryNode ADD FOREIGN KEY (parent_id) REFERENCES StoryNode(id) ON DELETE CASCADE; -- StoryNode can have a parent StoryNode, if parent is deleted, delete its children too
ALTER TABLE ReadingHistory ADD FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE; -- if user is deleted, delete their reading history  
ALTER TABLE ReadingHistory ADD FOREIGN KEY (story_id) REFERENCES Story(id) ON DELETE CASCADE; -- if story is deleted, delete its reading history
ALTER TABLE ReadingHistory ADD FOREIGN KEY (story_node_id) REFERENCES StoryNode(id) ON DELETE CASCADE; -- if story node is deleted, delete its reading history
ALTER TABLE Story_Genre ADD FOREIGN KEY (genre_id) REFERENCES Genre(id) ON DELETE CASCADE; -- if genre is deleted, delete its associations
ALTER TABLE Story_Genre ADD FOREIGN KEY (story_id) REFERENCES Story(id) ON DELETE CASCADE; -- if story is deleted, delete its associations
ALTER TABLE Rating ADD FOREIGN KEY (story_id) REFERENCES Story(id) ON DELETE CASCADE; -- if story is deleted, delete its ratings
ALTER TABLE Rating ADD FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE; -- if user is deleted, delete their ratings
ALTER TABLE FavouriteStory ADD FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE; -- if user is deleted, delete their favorite stories
ALTER TABLE FavouriteStory ADD FOREIGN KEY (story_id) REFERENCES Story(id) ON DELETE CASCADE; -- if story is deleted, delete its favorite associations
ALTER TABLE Review ADD FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE; -- if user is deleted, delete their comments
ALTER TABLE Review ADD FOREIGN KEY (story_id) REFERENCES Story(id) ON DELETE CASCADE; -- if story is deleted, delete its comments
ALTER TABLE Review ADD FOREIGN KEY (story_node_id) REFERENCES StoryNode(id) ON DELETE CASCADE; -- if story node is deleted, delete its comments 