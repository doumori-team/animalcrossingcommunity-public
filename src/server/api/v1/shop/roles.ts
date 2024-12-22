import * as db from '@db';
import { UserError } from '@errors';
import * as APITypes from '@apiTypes';
import { APIThisType, RoleType } from '@types';

async function roles(this: APIThisType, { id, apply = false, inactive = false }: rolesProps): Promise<RoleType[]>
{
	const permissionGranted: boolean = await this.query('v1/permission', { permission: 'view-shops' });

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

	const [shop] = await db.query(`
		SELECT id
		FROM shop
		WHERE id = $1::int
	`, id);

	if (!shop)
	{
		throw new UserError('no-such-shop');
	}

	const [roles, filledPositions, roleGames, roleDefaultServices, roleServices] = await Promise.all([
		db.query(`
			SELECT
				shop_role.id,
				shop_role.name,
				shop_role.description,
				shop_role.positions,
				shop_role.parent_id,
				shop_role.active,
				shop_role.apply,
				shop_role.contact,
				shop_role.applications
			FROM shop_role
			WHERE shop_role.shop_id = $1::int AND (shop_role.active = true OR $2 = false) AND (shop_role.apply = true OR $3 = false)
			ORDER BY shop_role.name ASC
		`, id, inactive, apply),
		db.query(`
			SELECT shop_role.id, count(*) AS count
			FROM shop_role
			JOIN shop_user_role ON (shop_user_role.shop_role_id = shop_role.id)
			JOIN shop_user ON (shop_user.id = shop_user_role.shop_user_id)
			WHERE shop_role.shop_id = $1::int AND shop_user.active = true
			GROUP BY shop_role.id
		`, id),
		db.query(`
			SELECT
				shop_role.id,
				COALESCE(default_service_game.id, service_game.id) AS game_id,
				COALESCE(default_service_game.name, service_game.name) AS name
			FROM shop_role
			JOIN shop_ac_game ON (shop_ac_game.shop_id = shop_role.shop_id)
			LEFT JOIN shop_role_default_service ON (shop_role_default_service.shop_role_id = shop_role.id)
			LEFT JOIN shop_role_service ON (shop_role_service.shop_role_id = shop_role.id)
			LEFT JOIN shop_default_service_ac_game ON (shop_default_service_ac_game.shop_default_service_id = shop_role_default_service.shop_default_service_id)
			LEFT JOIN shop_service_ac_game ON (shop_service_ac_game.shop_service_id = shop_role_service.shop_service_id)
			LEFT JOIN ac_game AS default_service_game ON (default_service_game.id = shop_default_service_ac_game.game_id AND shop_ac_game.game_id = default_service_game.id)
			LEFT JOIN ac_game AS service_game ON (service_game.id = shop_service_ac_game.game_id AND shop_ac_game.game_id = service_game.id)
			WHERE shop_role.shop_id = $1 AND (default_service_game.id IS NOT NULL OR service_game.id IS NOT NULL)
			GROUP BY shop_role.id, COALESCE(default_service_game.id, service_game.id), COALESCE(default_service_game.name, service_game.name)
		`, id),
		db.query(`
			SELECT
				CONCAT('default_', shop_default_service.id) AS id,
				shop_default_service.id AS real_id,
				shop_default_service.name,
				shop_default_service.description,
				true AS default,
				shop_role.id AS shop_role_id
			FROM shop_default_service
			JOIN shop_role_default_service ON (shop_role_default_service.shop_default_service_id = shop_default_service.id)
			JOIN shop_role ON (shop_role_default_service.shop_role_id = shop_role.id)
			WHERE shop_role.shop_id = $1
			ORDER BY shop_default_service.name ASC
		`, id),
		db.query(`
			SELECT
				shop_service.id,
				shop_service.id AS real_id,
				shop_service.name,
				shop_service.description,
				false AS default,
				shop_role.id AS shop_role_id
			FROM shop_service
			JOIN shop_role_service ON (shop_role_service.shop_service_id = shop_service.id)
			JOIN shop_role ON (shop_role_service.shop_role_id = shop_role.id)
			WHERE shop_role.shop_id = $1
			ORDER BY shop_service.name ASC
		`, id),
	]);

	return roles.map((role: any) =>
	{
		const filled = filledPositions.find((f: any) => f.id === role.id);
		const positions = Number(role.positions);
		const games = roleGames.filter((f: any) => f.id === role.id);
		const services = roleDefaultServices.concat(roleServices).filter((s: any) => s.shop_role_id === role.id);

		return {
			id: role.id,
			name: role.name,
			description: role.description,
			positionsAvailable: filled ? Math.max(0, positions - Number(filled.count)) : positions,
			games: games.length > 0 ? games.map((g: any) =>
			{
				return {
					id: g.game_id,
					name: g.name,
				};
			}) : [],
			parentId: role.parent_id,
			services: services.length > 0 ? services.map((s: any) =>
			{
				return {
					id: s.id,
					name: s.name,
				};
			}) : [],
			apply: role.apply,
			contact: role.contact,
			active: role.active,
			applications: role.applications,
		};
	});
}

roles.apiTypes = {
	id: {
		type: APITypes.number,
		required: true,
	},
	// apply, inactive will always be booleans
};

type rolesProps = {
	id: number
	apply: boolean
	inactive: boolean
};

export default roles;
