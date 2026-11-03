import {sqliteTable,text,integer,index,uniqueIndex} from 'drizzle-orm/sqlite-core';

export const preferences=sqliteTable('member_preferences',{
  userId:text('user_id').primaryKey(),gender:text('gender').notNull().default('unspecified'),interestedIn:text('interested_in').notNull().default('["everyone"]'),minAge:integer('min_age').notNull().default(18),maxAge:integer('max_age').notNull().default(100),
  visibility:integer('visibility').notNull().default(0),timezone:text('timezone').notNull().default('Asia/Kolkata'),cityOnly:integer('city_only').notNull().default(1),updatedAt:text('updated_at').notNull(),
});
export const profilePhotos=sqliteTable('profile_photos',{
  id:text('id').primaryKey(),userId:text('user_id').notNull(),objectKey:text('object_key').notNull(),contentType:text('content_type').notNull(),position:integer('position').notNull().default(0),createdAt:text('created_at').notNull(),
},t=>[index('profile_photo_user_idx').on(t.userId)]);
export const dailyBatches=sqliteTable('daily_batches',{
  id:text('id').primaryKey(),userId:text('user_id').notNull(),day:text('day').notNull(),profileIds:text('profile_ids').notNull(),createdAt:text('created_at').notNull(),
},t=>[uniqueIndex('daily_batch_unique').on(t.userId,t.day)]);
export const likes=sqliteTable('member_likes',{
  id:text('id').primaryKey(),senderId:text('sender_id').notNull(),recipientId:text('recipient_id').notNull(),createdAt:text('created_at').notNull(),
},t=>[uniqueIndex('member_like_unique').on(t.senderId,t.recipientId),index('member_like_recipient_idx').on(t.recipientId)]);
export const passes=sqliteTable('member_passes',{
  id:text('id').primaryKey(),userId:text('user_id').notNull(),targetId:text('target_id').notNull(),createdAt:text('created_at').notNull(),
},t=>[uniqueIndex('member_pass_unique').on(t.userId,t.targetId)]);
export const matches=sqliteTable('member_matches',{
  id:text('id').primaryKey(),userA:text('user_a').notNull(),userB:text('user_b').notNull(),status:text('status').notNull().default('active'),createdAt:text('created_at').notNull(),endedAt:text('ended_at'),
},t=>[uniqueIndex('member_match_unique').on(t.userA,t.userB),index('member_match_user_a_idx').on(t.userA),index('member_match_user_b_idx').on(t.userB)]);
export const messages=sqliteTable('member_messages',{
  id:text('id').primaryKey(),matchId:text('match_id').notNull(),senderId:text('sender_id').notNull(),text:text('text').notNull(),clientId:text('client_id').notNull(),createdAt:text('created_at').notNull(),
},t=>[uniqueIndex('message_idempotency_unique').on(t.senderId,t.clientId),index('message_match_idx').on(t.matchId,t.createdAt)]);
export const blocks=sqliteTable('member_blocks',{
  id:text('id').primaryKey(),userId:text('user_id').notNull(),targetId:text('target_id').notNull(),createdAt:text('created_at').notNull(),
},t=>[uniqueIndex('member_block_unique').on(t.userId,t.targetId)]);
export const reports=sqliteTable('member_reports',{
  id:text('id').primaryKey(),reporterId:text('reporter_id').notNull(),targetId:text('target_id').notNull(),reason:text('reason').notNull(),details:text('details').notNull(),status:text('status').notNull().default('open'),moderatorNote:text('moderator_note'),createdAt:text('created_at').notNull(),resolvedAt:text('resolved_at'),
},t=>[index('member_report_status_idx').on(t.status)]);
export const callSessions=sqliteTable('call_sessions',{
  id:text('id').primaryKey(),matchId:text('match_id').notNull(),callerId:text('caller_id').notNull(),recipientId:text('recipient_id').notNull(),status:text('status').notNull().default('invited'),createdAt:text('created_at').notNull(),expiresAt:text('expires_at').notNull(),endedAt:text('ended_at'),
},t=>[index('call_match_idx').on(t.matchId,t.createdAt)]);
export const callSignals=sqliteTable('call_signals',{
  id:integer('id').primaryKey({autoIncrement:true}),callId:text('call_id').notNull(),senderId:text('sender_id').notNull(),kind:text('kind').notNull(),payload:text('payload').notNull(),createdAt:text('created_at').notNull(),
},t=>[index('call_signal_idx').on(t.callId,t.id)]);
export const callFeedback=sqliteTable('call_feedback',{
  id:text('id').primaryKey(),callId:text('call_id').notNull(),userId:text('user_id').notNull(),choice:text('choice').notNull(),createdAt:text('created_at').notNull(),
},t=>[uniqueIndex('call_feedback_unique').on(t.callId,t.userId)]);
export const selfieChallenges=sqliteTable('selfie_challenges',{
  id:text('id').primaryKey(),userId:text('user_id').notNull(),prompt:text('prompt').notNull(),expiresAt:text('expires_at').notNull(),usedAt:text('used_at'),submissionId:text('submission_id'),createdAt:text('created_at').notNull(),
},t=>[index('selfie_challenge_user_idx').on(t.userId)]);
export const appLimits=sqliteTable('app_rate_limits',{
  key:text('key').primaryKey(),count:integer('count').notNull(),windowStart:integer('window_start').notNull(),expiresAt:integer('expires_at').notNull(),
});
export const mailOutbox=sqliteTable('local_mail_outbox',{
  id:text('id').primaryKey(),recipient:text('recipient').notNull(),subject:text('subject').notNull(),link:text('link').notNull(),createdAt:text('created_at').notNull(),
});
export const moderationAudit=sqliteTable('moderation_audit',{
  id:text('id').primaryKey(),actorId:text('actor_id').notNull(),targetId:text('target_id').notNull(),action:text('action').notNull(),note:text('note').notNull(),createdAt:text('created_at').notNull(),
});
export const mediaDeletions=sqliteTable('media_deletions',{
  objectKey:text('object_key').primaryKey(),notBefore:text('not_before').notNull(),createdAt:text('created_at').notNull(),
},t=>[index('media_deletion_ready_idx').on(t.notBefore)]);
