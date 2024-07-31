import * as db from '@db';
import { UserError } from '@errors';
import * as APITypes from '@apiTypes';
import { constants } from '@utils';
import { APIThisType, ShopNodeShopType } from '@types';

async function shop(this: APIThisType, {id}: shopProps) : Promise<ShopNodeShopType>
{
	const permissionGranted:boolean = await this.query('v1/permission', {permission: 'view-shops'});

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

    const [shopNode] = await db.query(`
        SELECT node.user_id, shop_node.shop_id, shop_order.id AS order_id, shop_application.id AS application_id
        FROM shop_node
        JOIN node ON (node.id = shop_node.node_id)
        LEFT JOIN shop_order ON (shop_order.node_id = shop_node.node_id)
        LEFT JOIN shop_application ON (shop_application.node_id = shop_node.node_id)
        WHERE shop_node.node_id = $1
    `, id);

    if (!shopNode)
    {
        throw new UserError('bad-format');
    }

    const nodePermissionGranted:boolean = await this.query('v1/node/permission', {permission: 'read', nodeId: id});

    if (!nodePermissionGranted)
    {
        throw new UserError('permission');
    }

    const [shop, customers, order, application] = await Promise.all([
        this.query('v1/shop', {id: shopNode.shop_id}),
        db.query(`
            SELECT user_node_permission.user_id
            FROM user_node_permission
            LEFT JOIN shop_user ON (shop_user.user_id = user_node_permission.user_id AND shop_user.shop_id = $2 AND shop_user.active = true)
            WHERE user_node_permission.node_id = $1 AND shop_user.id IS NULL
            GROUP BY user_node_permission.user_id
        `, id, shopNode.shop_id),
        shopNode.order_id ? this.query('v1/shop/thread', {id: shopNode.order_id, category: constants.shops.categories.orders, getItems: true}) : null,
        shopNode.application_id ? this.query('v1/shop/thread', {id: shopNode.application_id, category: constants.shops.categories.applications}) : null,
    ]);

    return <ShopNodeShopType>{
        id: shop.id,
        name: shop.name,
        customerIds: customers.map((c:any) => c.user_id),
        userId: shopNode.user_id,
        order: order,
        application: application,
    };
}

shop.apiTypes = {
	id: {
        type: APITypes.nodeId,
        required: true,
    },
}

type shopProps = {
    id: number
}

export default shop;