-- Remove most of the data, keeping only a small subset
-- The purpose of this is (a) to keep us below Heroku's limit on test site database sizes
-- and (b) to stop the database init scripts for devs' local environments from getting insanely huge
-- Remove any user data

CREATE TEMP TABLE tmp_node AS
SELECT * FROM node WHERE type = 'board' OR id IN (400000001, 400000002); -- Boards / Adoption BT First Post

CREATE TEMP TABLE tmp_node_revision AS
SELECT * FROM node_revision WHERE node_id IN (SELECT id FROM tmp_node);

CREATE TEMP TABLE tmp_user_group_node_permission AS
SELECT * FROM user_group_node_permission WHERE node_id IN (SELECT id FROM tmp_node);

CREATE TEMP TABLE tmp_rule AS
SELECT * FROM rule;

CREATE TEMP TABLE tmp_rule_violation AS
SELECT * FROM rule_violation;

TRUNCATE TABLE adoption;
TRUNCATE TABLE block_user;
TRUNCATE TABLE calendar_setting CASCADE;
TRUNCATE TABLE global_notification CASCADE;
TRUNCATE TABLE town CASCADE;
TRUNCATE TABLE emoji_setting CASCADE;
TRUNCATE TABLE feature CASCADE;
TRUNCATE TABLE friend_code CASCADE;
TRUNCATE TABLE friend_code_whitelist CASCADE;
TRUNCATE TABLE guide CASCADE;
TRUNCATE TABLE listing CASCADE;
TRUNCATE TABLE node CASCADE;
TRUNCATE TABLE pts_user_read_granted;
TRUNCATE TABLE notification;
TRUNCATE TABLE pattern CASCADE;
TRUNCATE TABLE poll CASCADE;
TRUNCATE TABLE scout_settings CASCADE;
TRUNCATE TABLE support_email CASCADE;
TRUNCATE TABLE top_bell CASCADE;
TRUNCATE TABLE town_tune CASCADE;
TRUNCATE TABLE treasure_offer CASCADE;
TRUNCATE TABLE user_ac_item;
TRUNCATE TABLE pc_catalog_item;
TRUNCATE TABLE shop CASCADE;
TRUNCATE TABLE user_avatar_accent_permission;
TRUNCATE TABLE user_avatar_background_permission;
TRUNCATE TABLE user_avatar_character_permission;
TRUNCATE TABLE user_avatar_coloration_permission;
TRUNCATE TABLE user_bell_shop_redeemed;
TRUNCATE TABLE user_buddy;
TRUNCATE TABLE user_donation;
TRUNCATE TABLE user_ip_address;
TRUNCATE TABLE user_node_permission;
TRUNCATE TABLE user_permission;
TRUNCATE TABLE user_ticket CASCADE;
TRUNCATE TABLE user_session CASCADE;
TRUNCATE TABLE url CASCADE;
TRUNCATE TABLE consent_log;
TRUNCATE TABLE wifi_rating_whitelist;
TRUNCATE TABLE support_ticket CASCADE;
TRUNCATE TABLE user_ban_length;
TRUNCATE TABLE user_global_notification;
TRUNCATE TABLE file CASCADE;
TRUNCATE TABLE user_donation_identification;
TRUNCATE TABLE user_avatar;
TRUNCATE TABLE site_statistic_data;
TRUNCATE TABLE users_site_header;
DELETE FROM users WHERE user_group_id NOT IN (11, 10, 9, 8, 6, 5, 4, 3, 2) AND id != 63167; -- All non active staff, ACC user for Adoption BT
UPDATE users SET bio_location = null, signature = null, last_active_time = null, show_birthday = false, show_age = false, away_start_date = null, away_end_date = null, name = null, show_email = false, bio = null, bio_format = null, signature_format = null, user_title = null;

INSERT INTO node SELECT * FROM tmp_node;
INSERT INTO node_revision SELECT * FROM tmp_node_revision;
INSERT INTO user_group_node_permission SELECT * FROM tmp_user_group_node_permission;
INSERT INTO rule SELECT id, "number", "name", description, null, original_rule_id, start_date, expiration_date, pending_expiration, category_id, reportable FROM tmp_rule;
INSERT INTO rule_violation SELECT * FROM tmp_rule_violation;

DROP TABLE tmp_node, tmp_node_revision, tmp_user_group_node_permission, tmp_rule, tmp_rule_violation;