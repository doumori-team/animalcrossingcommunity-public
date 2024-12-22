import * as db from '@db';
import { UserError } from '@errors';
import * as APITypes from '@apiTypes';
import { APIThisType, ServiceType } from '@types';

async function services(this: APIThisType, { id, inactive = false }: servicesProps): Promise<ServiceType[]>
{
	const permissionGranted: boolean = await this.query('v1/permission', { permission: 'view-shops' });

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

	if (id)
	{
		const [shop] = await db.query(`
			SELECT id
			FROM shop
			WHERE id = $1::int
		`, id);

		if (!shop)
		{
			throw new UserError('no-such-shop');
		}
	}

	if (id)
	{
		const [defaultServices, shopServices, defaultServicesGames, servicesGames] = await Promise.all([
			inactive ? db.query(`
				SELECT
					CONCAT('default_', shop_default_service.id) AS id,
					shop_default_service.id AS real_id,
					shop_default_service.name,
					shop_default_service.description,
					true AS default
				FROM shop_default_service
				ORDER BY shop_default_service.name ASC
			`) : db.query(`
				SELECT
					CONCAT('default_', shop_default_service.id) AS id,
					shop_default_service.id AS real_id,
					shop_default_service.name,
					shop_default_service.description,
					true AS default
				FROM shop_default_service
				JOIN shop_default_service_shop ON (shop_default_service_shop.shop_default_service_id = shop_default_service.id)
				WHERE shop_default_service_shop.shop_id = $1::int
				ORDER BY shop_default_service.name ASC
			`, id),
			db.query(`
				SELECT
					shop_service.id,
					shop_service.id AS real_id,
					shop_service.name,
					shop_service.description,
					false AS default
				FROM shop_service
				WHERE shop_service.shop_id = $1::int AND (shop_service.active = true OR $2 = false)
				ORDER BY shop_service.name ASC
			`, id, inactive),
			db.query(`
				SELECT
					ac_game.id,
					ac_game.shortname,
					shop_default_service_ac_game.shop_default_service_id AS service_id
				FROM ac_game
				JOIN shop_default_service_ac_game ON (shop_default_service_ac_game.game_id = ac_game.id)
			`),
			db.query(`
				SELECT
					ac_game.id,
					ac_game.shortname,
					shop_service.id AS service_id
				FROM ac_game
				JOIN shop_service_ac_game ON (shop_service_ac_game.game_id = ac_game.id)
				JOIN shop_service ON (shop_service.id = shop_service_ac_game.shop_service_id)
				WHERE shop_service.shop_id = $1::int
			`, id),
		]);

		return defaultServices.concat(shopServices).map((service: any) =>
		{
			return {
				id: service.id,
				name: service.name,
				description: service.description,
				default: service.default,
				games: service.default ? defaultServicesGames.filter((g: any) => g.service_id = service.real_id) : servicesGames.filter((g: any) => g.service_id = service.real_id),
			};
		});
	}

	const [defaultServices, defaultServicesGames] = await Promise.all([
		db.query(`
			SELECT
				CONCAT('default_', shop_default_service.id) AS id,
				shop_default_service.id AS real_id,
				shop_default_service.name,
				shop_default_service.description,
				true AS default
			FROM shop_default_service
			ORDER BY shop_default_service.name ASC
		`),
		db.query(`
			SELECT
				ac_game.id,
				ac_game.shortname,
				shop_default_service_ac_game.shop_default_service_id AS service_id
			FROM ac_game
			JOIN shop_default_service_ac_game ON (shop_default_service_ac_game.game_id = ac_game.id)
		`),
	]);

	return defaultServices.map((s: any) =>
	{
		return {
			id: s.id,
			name: s.name,
			description: s.description,
			default: s.default,
			games: defaultServicesGames.filter((g: any) => g.service_id = s.real_id),
		};
	});
}

services.apiTypes = {
	id: {
		type: APITypes.number,
		nullable: true,
	},
	// inactive will always be boolean
};

type servicesProps = {
	id: number | null
	inactive: boolean
};

export default services;
