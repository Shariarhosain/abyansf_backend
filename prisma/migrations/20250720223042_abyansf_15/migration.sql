-- CreateIndex
CREATE INDEX "Listing_specificCategoryId_idx" ON "Listing"("specificCategoryId");

-- CreateIndex
CREATE INDEX "Listing_isActive_idx" ON "Listing"("isActive");

-- CreateIndex
CREATE INDEX "Listing_createdAt_idx" ON "Listing"("createdAt");

-- CreateIndex
CREATE INDEX "Listing_location_idx" ON "Listing"("location");

-- CreateIndex
CREATE INDEX "Log_userId_idx" ON "Log"("userId");

-- CreateIndex
CREATE INDEX "Log_createdAt_idx" ON "Log"("createdAt");

-- CreateIndex
CREATE INDEX "Log_action_idx" ON "Log"("action");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_isRead_idx" ON "Notification"("isRead");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE INDEX "SubCategory_mainCategoryId_idx" ON "SubCategory"("mainCategoryId");

-- CreateIndex
CREATE INDEX "SubCategory_hasSpecificCategory_idx" ON "SubCategory"("hasSpecificCategory");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_isActive_idx" ON "User"("isActive");

-- CreateIndex
CREATE INDEX "Verification_userId_idx" ON "Verification"("userId");

-- CreateIndex
CREATE INDEX "Verification_email_idx" ON "Verification"("email");

-- CreateIndex
CREATE INDEX "Verification_isUsed_idx" ON "Verification"("isUsed");

-- CreateIndex
CREATE INDEX "idx_listing_booking_status" ON "listingBooking"("status");

-- CreateIndex
CREATE INDEX "idx_listing_booking_user_id" ON "listingBooking"("userId");

-- CreateIndex
CREATE INDEX "idx_listing_booking_created_at" ON "listingBooking"("createdAt");

-- CreateIndex
CREATE INDEX "listingBooking_listingId_idx" ON "listingBooking"("listingId");

-- CreateIndex
CREATE INDEX "listingBooking_bookingDate_idx" ON "listingBooking"("bookingDate");

-- CreateIndex
CREATE INDEX "listingBooking_status_userId_idx" ON "listingBooking"("status", "userId");

-- CreateIndex
CREATE INDEX "listingBooking_status_createdAt_idx" ON "listingBooking"("status", "createdAt");

-- CreateIndex
CREATE INDEX "idx_subcategory_booking_status" ON "subCategoryBooking"("status");

-- CreateIndex
CREATE INDEX "idx_subcategory_booking_user_id" ON "subCategoryBooking"("userId");

-- CreateIndex
CREATE INDEX "idx_subcategory_booking_created_at" ON "subCategoryBooking"("createdAt");

-- CreateIndex
CREATE INDEX "subCategoryBooking_subCategoryId_idx" ON "subCategoryBooking"("subCategoryId");

-- CreateIndex
CREATE INDEX "subCategoryBooking_status_userId_idx" ON "subCategoryBooking"("status", "userId");

-- CreateIndex
CREATE INDEX "subCategoryBooking_status_createdAt_idx" ON "subCategoryBooking"("status", "createdAt");
