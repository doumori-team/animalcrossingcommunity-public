import * as db from '@db';
import { UserError } from '@errors';
import { constants } from '@utils';
import * as APITypes from '@apiTypes';
import { APIThisType, SuccessType, MarkupStyleType } from '@types';

async function apply(this: APIThisType, { id, roleId, text, format, gameIds }: applyProps): Promise<SuccessType>
{
	const permissionGranted: boolean = await this.query('v1/permission', { permission: 'order-apply-shops' });

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

	if (!this.userId)
	{
		throw new UserError('login-needed');
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

	const [role] = await db.query(`
		SELECT id
		FROM shop_role
		WHERE id = $1::int
	`, roleId);

	if (!role)
	{
		throw new UserError('no-such-role');
	}

	gameIds = await Promise.all(gameIds.map(async(id) =>
	{
		if (isNaN(id))
		{
			throw new UserError('no-such-ac-game');
		}

		const [checkId] = await db.query(`
			SELECT id
			FROM ac_game
			WHERE id = $1::int
		`, id);

		if (!checkId)
		{
			throw new UserError('no-such-ac-game');
		}

		return Number(id);
	}));

	const [pendingApplication] = await db.query(`
		SELECT shop_application.id
		FROM shop_application
		WHERE shop_application.shop_id = $1 AND shop_application.user_id = $2 AND (shop_application.waitlisted = true OR shop_application.applied > current_date - interval '30 days')
	`, shop.id, this.userId);

	if (pendingApplication)
	{
		throw new UserError('shop-pending-application');
	}

	const [currentEmployee] = await db.query(`
		SELECT shop_user.id
		FROM shop_user
		JOIN shop_user_role ON (shop_user_role.shop_user_id = shop_user.id)
		WHERE shop_user.shop_id = $1 AND shop_user.user_id = $2 AND shop_user.active = true AND shop_user_role.shop_role_id = $3
	`, shop.id, this.userId, roleId);

	if (currentEmployee)
	{
		throw new UserError('shop-current-employee');
	}

	const shopApplicationId = await db.transaction(async (query: any) =>
	{
		const [shopApplication] = await query(`
			INSERT INTO shop_application (shop_id, user_id, shop_role_id, application, application_format)
			VALUES ($1, $2, $3, $4, $5)
			RETURNING id
		`, id, this.userId, roleId, text, format);

		await Promise.all([
			gameIds.map(async (gameId) =>
			{
				await query(`
					INSERT INTO shop_application_ac_game (shop_application_id, game_id)
					VALUES ($1, $2)
				`, shopApplication.id, gameId);
			}),
		]);

		return shopApplication.id;
	});

	await this.query('v1/notification/create', { id: shopApplicationId, type: constants.notification.types.shopApplication });

	return {
		_success: 'Thank you for applying! You will be notified when your application has been reviewed.',
	};
}

apply.apiTypes = {
	id: {
		type: APITypes.number,
		required: true,
	},
	roleId: {
		type: APITypes.number,
		required: true,
	},
	text: {
		type: APITypes.string,
		default: '',
		length: constants.max.post1,
		required: true,
		profanity: true,
	},
	format: {
		type: APITypes.string,
		default: '',
		includes: ['markdown', 'bbcode', 'plaintext'],
		required: true,
	},
	gameIds: {
		type: APITypes.array,
		required: true,
	},
};

type applyProps = {
	id: number
	roleId: number
	text: string
	format: MarkupStyleType
	gameIds: any[]
};

export default apply;
