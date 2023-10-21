-- Set test accounts' user groups
INSERT INTO users (id, user_group_id) VALUES
	(2,  3), -- test-admin
	(3,  2), -- test-mod
	(4,  4), -- test-scout
	-- Don't need to define test-user because "user" is the default group
	(7,  5), -- test-researcher
	(11, 6), -- test-developer
	(12, 7),  -- test-ex-staff
	(840405, 9), -- test-owner
	(840406, 10), -- test-dev-lead
	(840407, 11) -- test-researcher-lead
	-- test-new-member will be defined in the code
ON CONFLICT (id) DO UPDATE
	SET user_group_id = EXCLUDED.user_group_id;

-- So birthdays check continues to work
UPDATE users SET show_birthday = true, last_active_time = now() WHERE id = 2;