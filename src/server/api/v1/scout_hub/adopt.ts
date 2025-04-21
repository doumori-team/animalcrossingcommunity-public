import * as db from '@db';
import { UserError } from '@errors';
import { utils, dateUtils, constants } from '@utils';
import * as APITypes from '@apiTypes';
import { APIThisType, UserType, UserLiteType } from '@types';

async function adopt(this: APIThisType, { adopteeId, scoutId }: adoptProps): Promise<{ id: number }>
{
	if (!this.userId)
	{
		throw new UserError('login-needed');
	}

	// Only new user or those who can reassign may do adoption
	if (this.userId !== adopteeId)
	{
		const permGranted: boolean = await this.query('v1/permission', { permission: 'adoption-reassign' });

		if (!permGranted)
		{
			throw new UserError('permission');
		}
	}

	// Check parameters
	const adoptee: UserType = await this.query('v1/user', { id: adopteeId });

	let scout: UserLiteType | null = null;

	if (scoutId)
	{
		scout = await this.query('v1/user_lite', { id: scoutId });

		const permissionGranted: boolean = await this.query('v1/permission', { permission: 'adoption-reassign' });

		if (!permissionGranted)
		{
			throw new UserError('permission');
		}
	}
	else
	{
		// Confirm not already adopted
		const [adoption] = await db.query(`
			SELECT id
			FROM adoption
			WHERE adoptee_id = $1::int
		`, adoptee.id);

		if (adoption)
		{
			throw new UserError('already-adopted');
		}
	}

	// Confirm adoption eligibility
	if (!dateUtils.isNewMember(adoptee.signupDate))
	{
		throw new UserError('ineligible-adoption');
	}

	// Perform queries

	// Figure out which scout gets the adoptee
	// Round-table adoption, each scout in order by their user id

	if (!scoutId)
	{
		[scout] = await db.query(`
			SELECT
				users.id,
				user_account_cache.username
			FROM users
			JOIN user_account_cache ON (user_account_cache.id = users.id)
			WHERE users.user_group_id = $1 AND
				(away_start_date IS NULL OR current_date NOT BETWEEN away_start_date AND away_end_date)	AND
				users.id > (SELECT scout_id from adoption order by adoption.adopted desc limit 1)
			ORDER BY users.id ASC
			LIMIT 1
		`, constants.userGroupIds.scout);

		if (scout == null)
		{
			// if none found, get lowest scout id
			[scout] = await db.query(`
				SELECT
					users.id,
					user_account_cache.username
				FROM users
				JOIN user_account_cache ON (user_account_cache.id = users.id)
				WHERE users.user_group_id = $1 AND
					(away_start_date IS NULL OR current_date NOT BETWEEN away_start_date AND away_end_date)
				ORDER BY users.id ASC
				LIMIT 1
			`, constants.userGroupIds.scout);
		}
	}

	scout = (scout as UserLiteType);

	// Create adoption thread

	const nodeId = await db.transaction(async (query: any) =>
	{
		if (scoutId)
		{
			// Lock old thread
			const [adoption] = await query(`
				SELECT node_id
				FROM adoption
				WHERE adoptee_id = $1::int
			`, adoptee.id);

			if (adoption)
			{
				await query(`
					UPDATE node
					SET locked = NOW(), thread_type = 'normal'
					WHERE id = $1::int
				`, adoption.node_id);
			}
		}

		let [nodeId, scoutSettings] = await Promise.all([
			db.transaction(async (_: any) =>
			{
				const [result] = await query(`
					INSERT INTO node (parent_node_id, user_id, type)
					VALUES ($1::int, $2::int, $3::node_type)
					RETURNING id;
				`, constants.boardIds.adopteeThread, scout?.id, 'thread');

				const nodeId = result.id;

				await query(`
					INSERT INTO node_revision (node_id, reviser_id, title)
					VALUES ($1::int, $2::int, $3::text)
				`, nodeId, scout?.id, `${adoptee.username} Adoption`);

				return nodeId;
			}),
			this.query('v1/scout_hub/settings', { id: scout?.id }),
			query(`
				DELETE FROM adoption
				WHERE adoptee_id = $1::int
			`, adoptee.id),
		]);

		let welcomeTemplate = scoutSettings.welcomeTemplate ? scoutSettings.welcomeTemplate : constants.scoutHub.defaultWelcomeTemplate;

		utils.getScoutTemplateConfig(scout, adoptee).map(config =>
		{
			welcomeTemplate = welcomeTemplate.replaceAll(config.character, config.replace);
		});

		const format = scoutSettings.welcomeTemplateFormat ? scoutSettings.welcomeTemplateFormat : 'plaintext';

		await db.transaction(async (_: any) =>
		{
			const [result] = await query(`
				INSERT INTO node (parent_node_id, user_id, type)
				VALUES ($1::int, $2::int, $3::node_type)
				RETURNING id;
			`, nodeId, scout.id, 'post');

			await query(`
				INSERT INTO node_revision (node_id, reviser_id, content, content_format)
				VALUES ($1::int, $2::int, $3::text, $4::node_content_format)
			`, result.id, scout.id, welcomeTemplate, format);
		});

		await Promise.all([
			// Allow read / reply to scout & adoptee, lock to scout
			query(`
				INSERT INTO user_node_permission (user_id, node_id, node_permission_id, granted)
				VALUES
				($2::int, $1::int, $4::int, true), ($3::int, $1::int, $4::int, true),
				($2::int, $1::int, $5::int, true), ($3::int, $1::int, $5::int, true),
				($2::int, $1::int, $6::int, true)
			`, nodeId, scout.id, adoptee.id, constants.nodePermissions.read, constants.nodePermissions.reply, constants.nodePermissions.lock),
			query(`
				INSERT INTO adoption (scout_id, adoptee_id, node_id)
				VALUES ($1::int, $2::int, $3::int)
			`, scout.id, adoptee.id, nodeId),
			// join adoptee buddy thread
			query(`
				INSERT INTO user_node_permission (user_id, node_id, node_permission_id, granted)
				VALUES ($1::int, $2::int, $3::int, true), ($1::int, $2::int, $4::int, true)
				ON CONFLICT ON CONSTRAINT user_node_permission_pkey DO NOTHING
			`, adoptee.id, constants.boardIds.adopteeBT, constants.nodePermissions.read, constants.nodePermissions.reply),
		]);

		return nodeId;
	});

	await db.updateThreadStats(nodeId);

	await this.query('v1/notification/create', {
		id: nodeId,
		type: constants.notification.types.scoutAdoption,
	});

	return {
		id: nodeId,
	};
}

adopt.apiTypes = {
	adopteeId: {
		type: APITypes.userId,
		default: true,
	},
	scoutId: {
		type: APITypes.userId,
		nullable: true,
	},
};

type adoptProps = {
	adopteeId: number
	scoutId: number
};

export default adopt;
