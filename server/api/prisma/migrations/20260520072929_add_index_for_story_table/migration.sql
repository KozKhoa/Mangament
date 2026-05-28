-- CreateIndex
CREATE INDEX "Story_deleted_status_is_actived_created_at_idx" ON "Story"("deleted_status", "is_actived", "created_at" DESC);

-- CreateIndex
CREATE INDEX "Story_deleted_status_is_actived_star_idx" ON "Story"("deleted_status", "is_actived", "star" DESC);

-- CreateIndex
CREATE INDEX "Story_deleted_status_is_actived_view_idx" ON "Story"("deleted_status", "is_actived", "view" DESC);

-- CreateIndex
CREATE INDEX "Story_deleted_status_is_actived_updated_at_idx" ON "Story"("deleted_status", "is_actived", "updated_at" DESC);

-- CreateIndex
CREATE INDEX "Genre_name_idx" ON "Genre"("name");

-- CreateIndex
CREATE INDEX "Story_Genre_genre_id_idx" ON "Story_Genre"("genre_id");
