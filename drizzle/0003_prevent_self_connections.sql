-- Keep self-connections out of the database, including direct writes.
CREATE TRIGGER member_likes_no_self_insert BEFORE INSERT ON member_likes
WHEN NEW.sender_id=NEW.recipient_id BEGIN
  SELECT RAISE(ABORT, 'A like needs two different members');
END;
--> statement-breakpoint
CREATE TRIGGER member_likes_no_self_update BEFORE UPDATE OF sender_id,recipient_id ON member_likes
WHEN NEW.sender_id=NEW.recipient_id BEGIN
  SELECT RAISE(ABORT, 'A like needs two different members');
END;
--> statement-breakpoint
CREATE TRIGGER member_matches_no_self_insert BEFORE INSERT ON member_matches
WHEN NEW.user_a=NEW.user_b BEGIN
  SELECT RAISE(ABORT, 'A match needs two different members');
END;
--> statement-breakpoint
CREATE TRIGGER member_matches_no_self_update BEFORE UPDATE OF user_a,user_b ON member_matches
WHEN NEW.user_a=NEW.user_b BEGIN
  SELECT RAISE(ABORT, 'A match needs two different members');
END;
--> statement-breakpoint
CREATE TRIGGER member_messages_valid_sender BEFORE INSERT ON member_messages
WHEN NOT EXISTS(SELECT 1 FROM member_matches m WHERE m.id=NEW.match_id AND m.user_a<>m.user_b AND (NEW.sender_id=m.user_a OR NEW.sender_id=m.user_b)) BEGIN
  SELECT RAISE(ABORT, 'A message must belong to a match participant');
END;
