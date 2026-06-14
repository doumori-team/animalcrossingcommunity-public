import * as db from '@db';
import { UserError } from '@errors';
import * as APITypes from '@apiTypes';
import * as accounts from '@accounts';
import { constants } from '@utils';
import { APIThisType, UserBioType } from '@types';

/*
 * Lists the information about a user that should appear in the "Bio" tab of their profile.
 */
async function bio(this: APIThisType, { id }: bioProps): Promise<UserBioType>
{
	// Run query
	const [result] = await db.query(`
		SELECT
			bio_location AS location,
			name,
			bio,
			bio_format AS format,
			show_email
		FROM users
		WHERE id = $1::int
	`, id);

	if (!result)
	{
		throw new UserError('no-such-user');
	}

	let email: string | null = null;

	if (result.show_email)
	{
		const userData = await accounts.getUserData(id);

		email = userData.email;
	}

	const [userFiles, userPolls, userPollAnswers, totalUsers]: [{
		id: number
		file_id: string
		name: string
		width: number | null
		height: number | null
		caption: string
	}[],
	{
		poll_id: number
		sort_order: number
		description: string
		sequence: number
		votes: number
		active: boolean
	}[],
	{
		poll_id: number
	}[],
	{
		poll_id: number
		count: number
	}[]] = await Promise.all([
		db.query(`
			SELECT file.id, file.file_id, file.name, file.width, file.height, file.caption
			FROM user_file
			JOIN file ON (user_file.file_id = file.id)
			WHERE user_file.user_id = $1::int
			ORDER BY file.sequence ASC
		`, id),
		db.query(`
			SELECT
				user_poll.id AS poll_id,
				user_poll.sort_order,
				user_poll_option.description,
				user_poll_option.sequence,
				user_poll_option.votes,
				user_poll.active
			FROM user_poll_option
			JOIN user_poll ON (user_poll_option.poll_id = user_poll.id)
			WHERE user_poll.user_id = $1::int AND user_poll.active = true
			ORDER BY user_poll.sort_order ASC, user_poll_option.sequence ASC
		`, id),
		db.query(`
			SELECT user_poll_answer.poll_id
			FROM user_poll_answer
			JOIN user_poll ON (user_poll_answer.poll_id = user_poll.id)
			WHERE user_poll.user_id = $1::int AND user_poll.active = true AND user_poll_answer.user_id = $2
		`, id, this.userId),
		db.query(`
			SELECT user_poll_answer.poll_id, count(*) AS count
			FROM user_poll_answer
			JOIN user_poll ON (user_poll_answer.poll_id = user_poll.id)
			WHERE user_poll.user_id = $1::int AND user_poll.active = true
			GROUP BY user_poll_answer.poll_id
		`, id),
	]);

	if (id === this.userId)
	{
		Promise.all([
			this.query('v1/notification/destroy', {
				id: id,
				type: constants.notification.types.giftDonation,
			}),
			this.query('v1/notification/destroy', {
				id: id,
				type: constants.notification.types.avatarCleared,
			}),
			this.query('v1/notification/destroy', {
				id: 0, // see notification/destroy
				type: constants.notification.types.badge,
			}),
		]);
	}

	const pollsMap = new Map<number, UserBioType['polls'][number]>();
	const userPollAnswersMapped = userPollAnswers.map(x => x.poll_id);

	for (const row of userPolls)
	{
		if (!pollsMap.has(row.poll_id))
		{
			pollsMap.set(row.poll_id, {
				id: row.poll_id,
				sortOrder: row.sort_order,
				options: [],
				userVoted: userPollAnswersMapped.includes(row.poll_id),
				totalUsers: totalUsers.find(x => x.poll_id === row.poll_id)?.count ?? 0,
				active: row.active,
			});
		}

		pollsMap.get(row.poll_id)!.options.push({
			description: row.description,
			sequence: row.sequence,
			votes: row.votes,
		});
	}

	return <UserBioType>{
		location: result.location,
		name: result.name,
		bio: result.bio,
		format: result.format,
		email: email,
		files: userFiles ? userFiles.map(file =>
		{
			return {
				id: file.id,
				fileId: file.file_id,
				name: file.name,
				width: file.width,
				height: file.height,
				caption: file.caption,
			};
		}) : [],
		polls: [...pollsMap.values()],
	};
}

bio.permissions = [
	'view-profiles',
	'userId',
];

bio.apiTypes = {
	id: {
		type: APITypes.userId,
		required: true,
	},
};

type bioProps = {
	id: number
};

export default bio;
