import * as db from '@db';
import { UserError } from '@errors';
import * as APITypes from '@apiTypes';
import { APIThisType, EmployeesType, ShopType } from '@types';

async function employees(this: APIThisType, {id}: employeesProps) : Promise<EmployeesType>
{
	const permissionGranted:boolean = await this.query('v1/permission', {permission: 'modify-shops'});

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

	if (!this.userId)
	{
		throw new UserError('login-needed');
	}

	await this.query('v1/user_lite', {id: this.userId});

	const shop:ShopType = await this.query('v1/shop', {id: id});

	if (!shop)
	{
		throw new UserError('no-such-shop');
	}

	if (!shop.owners.some(o => o.id === this.userId))
	{
		throw new UserError('permission');
	}

	const [employees, roles, roleDefaultServices, roleServices, filledPositions] = await Promise.all([
		db.query(`
			SELECT shop_user.user_id AS id, user_account_cache.username, shop_role.name AS role
			FROM shop_user
			JOIN user_account_cache ON (user_account_cache.id = shop_user.user_id)
			JOIN shop_user_role oN (shop_user_role.shop_user_id = shop_user.id)
			JOIN shop_role ON (shop_user_role.shop_role_id = shop_role.id)
			JOIN (
				WITH RECURSIVE ENTRIES as (
					SELECT id, parent_id, name, id AS root_id, 1 AS level
					FROM shop_role
					WHERE parent_id IS NULL
					UNION ALL
					SELECT c.id, c.parent_id, c.name, p.root_id, p.level + 1
					FROM shop_role c
					JOIN entries p ON (p.id = c.parent_id)
				)
				SELECT id, name, level
				FROM entries
				ORDER BY root_id, level, id
			) AS ordered_shop_roles ON (ordered_shop_roles.id = shop_role.id)
			WHERE shop_user.shop_id = $1 AND shop_user.active = true
			ORDER BY ordered_shop_roles.level ASC, user_account_cache.username ASC
		`, id),
		db.query(`
			SELECT
				shop_role.id,
				shop_role.name,
				shop_role.description,
				shop_role.parent_id,
				shop_role.positions,
				shop_role.apply,
				shop_role.contact,
				shop_role.active,
				shop_role.applications,
				shop_role.stats
			FROM shop_role
			WHERE shop_role.shop_id = $1
			ORDER BY shop_role.name ASC
		`, id),
		db.query(`
			SELECT CONCAT('default_', shop_default_service.id) AS id, shop_default_service.name, shop_role_default_service.shop_role_id
			FROM shop_default_service
			JOIN shop_default_service_shop ON (shop_default_service_shop.shop_default_service_id = shop_default_service.id)
			JOIN shop_role_default_service ON (shop_role_default_service.shop_default_service_id = shop_default_service.id)
			WHERE shop_default_service_shop.shop_id = $1
			ORDER BY shop_default_service.name ASC
		`, id),
		db.query(`
			SELECT shop_service.id, shop_service.name, shop_role_service.shop_role_id
			FROM shop_service
			JOIN shop_role_service ON (shop_role_service.shop_service_id = shop_service.id)
			WHERE shop_service.shop_id = $1
			ORDER BY shop_service.name ASC
		`, id),
		db.query(`
			SELECT shop_role.id, count(*) AS count
			FROM shop_role
			JOIN shop_user_role ON (shop_user_role.shop_role_id = shop_role.id)
			JOIN shop_user ON (shop_user.id = shop_user_role.shop_user_id)
			WHERE shop_role.shop_id = $1::int AND shop_user.active = true
			GROUP BY shop_role.id
		`, id),
	]);

	return {
		list: employees,
		roles: roles.map((role:any) => {
			const filled = filledPositions.find((f:any) => f.id === role.id);
			const positions = Number(role.positions);

			return {
				id: role.id,
				shopId: id,
				name: role.name,
				description: role.description,
				parentId: role.parent_id,
				positions: role.positions,
				apply: role.apply,
				contact: role.contact,
				active: role.active,
				services: roleDefaultServices.filter((s:any) => s.shop_role_id === role.id).concat(roleServices.filter((s:any) => s.shop_role_id === role.id)).map((s:any) => {
					return {
						id: s.id,
						name: s.name,
					};
				}),
				positionsAvailable: filled ? Math.max(0, positions-Number(filled.count)) : positions,
				applications: role.applications,
				stats: role.stats,
			};
		}),
	}
}

employees.apiTypes = {
	id: {
		type: APITypes.number,
		required: true,
	},
}

type employeesProps = {
	id: number
}

export default employees;