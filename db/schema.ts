import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
export const passports = sqliteTable('passports', {
  id:text('id').primaryKey(), userId:text('user_id').notNull().unique(), name:text('name').notNull(), age:integer('age').notNull(),
  city:text('city').notNull(), area:text('area').notNull(), intent:text('intent').notNull(), bio:text('bio').notNull(), interests:text('interests').notNull(),
  adultDeclaredAt:text('adult_declared_at').notNull(), policyAcceptedAt:text('policy_accepted_at').notNull(), policyVersion:text('policy_version').notNull(),
  selfieKey:text('selfie_key'), selfieSubmittedAt:text('selfie_submitted_at'), reviewStatus:text('review_status').notNull().default('not_submitted'),
  reviewNote:text('review_note'), reviewedAt:text('reviewed_at'), createdAt:text('created_at').notNull(), updatedAt:text('updated_at').notNull(),
});
export const passportReviews = sqliteTable('passport_reviews', {
  id:text('id').primaryKey(), passportId:text('passport_id').notNull().references(()=>passports.id), reviewerId:text('reviewer_id').notNull(),
  decision:text('decision').notNull(), note:text('note').notNull(), createdAt:text('created_at').notNull(),
});
