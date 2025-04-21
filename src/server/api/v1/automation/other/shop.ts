import { faker } from '@faker-js/faker/locale/en';

import * as db from '@db';
import { UserError } from '@errors';
import { constants } from '@utils';
import { ACCCache } from '@cache';
import { APIThisType, SuccessType, ACGameItemType } from '@types';

export default async function shop(this: APIThisType): Promise<SuccessType>
{
	// You must be logged in and on a test site
	if (constants.LIVE_SITE)
	{
		throw new UserError('permission');
	}

	if (!this.userId)
	{
		throw new UserError('login-needed');
	}

	// Perform queries

	// get info
	const [gameIds] = await Promise.all([
		db.query(`
			SELECT id
			FROM ac_game
			WHERE has_town = true
		`),
	]);

	let staffUserIds = await db.query(`
		SELECT users.id
		FROM users
		JOIN user_group ON (user_group.id = users.user_group_id)
		JOIN user_group AS staff_group ON (user_group.parent_id = staff_group.id)
		WHERE staff_group.identifier = 'staff' AND users.id != $1
	`, this.userId);

	if (staffUserIds.length === 0)
	{
		throw new UserError('bad-format');
	}

	await db.transaction(async (query: any) =>
	{
		// Create Shop

		console.info('Creating shop');

		const shopName = faker.company.name();
		const shopShortDescription = faker.company.catchPhrase();
		const shopDescription = faker.company.buzzPhrase();
		const shopDescriptionFormat = 'plaintext';
		const shopFree = faker.datatype.boolean();
		const shopVacationStartDate = faker.date.between({ from: '2020-01-01T00:00:00.000Z', to: '2030-01-01T00:00:00.000Z' });
		const shopVacationEndDate = faker.date.between({ from: shopVacationStartDate, to: '2030-01-01T00:00:00.000Z' });
		const shopAllowTransfer = faker.datatype.boolean();
		const shopActive = true;

		const [shop] = await query(`
			INSERT INTO shop (name, short_description, description, description_format, free, vacation_start_date, vacation_end_date, allow_transfer, active)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
			RETURNING id
		`, shopName, shopShortDescription, shopDescription, shopDescriptionFormat, shopFree, shopVacationStartDate, shopVacationEndDate, shopAllowTransfer, shopActive);

		const shopId = shop.id;

		const [[role], [shopUser]] = await Promise.all([
			query(`
				INSERT INTO shop_role (shop_id, name, description, parent_id, contact, applications, apply, stats)
				VALUES ($1, 'Owner', 'The leader of the shop', null, true, true, false, true)
				RETURNING id
			`, shopId),
			query(`
				INSERT INTO shop_user (shop_id, user_id)
				VALUES ($1, $2)
				RETURNING id
			`, shopId, this.userId),
		]);

		const games = faker.helpers.arrayElements(gameIds);

		await Promise.all([
			query(`
				INSERT INTO shop_user_role (shop_role_id, shop_user_id)
				VALUES ($1, $2)
			`, role.id, shopUser.id),
			games.map(async (game: any) =>
			{
				const perOrder = faker.number.int(100);
				const stackOrQuantity = faker.datatype.boolean();
				const completeOrder = faker.datatype.boolean();

				await query(`
					INSERT INTO shop_ac_game (shop_id, game_id, per_order, stack_or_quantity, complete_order)
					VALUES ($1, $2, $3, $4, $5)
				`, shopId, game.id, perOrder, stackOrQuantity, completeOrder);

				const catalogItems: ACGameItemType[number]['all']['items'] = (await ACCCache.get(`${constants.cacheKeys.sortedAcGameCategories}_${game.id}_all_items`)).filter((item: any) => item.tradeable);

				const items = faker.helpers.arrayElements(catalogItems, 5);

				await Promise.all([
					items.map(async (item: any) =>
					{
						await query(`
							INSERT INTO shop_catalog_item (shop_id, catalog_item_id, game_id)
							VALUES ($1, $2, $3)
						`, shopId, item.id, game.id);
					}),
				]);
			}),
			query(`
				INSERT INTO shop_audit (shop_id, value, user_id)
				VALUES ($1, $2, $3)
				ON CONFLICT (shop_id, value) DO UPDATE SET user_id = EXCLUDED.user_id
			`, shopId, constants.userTicket.types.shopName, this.userId),
			query(`
				INSERT INTO shop_audit (shop_id, value, user_id)
				VALUES ($1, $2, $3)
				ON CONFLICT (shop_id, value) DO UPDATE SET user_id = EXCLUDED.user_id
			`, shopId, constants.userTicket.types.shopShortDescription, this.userId),
			query(`
				INSERT INTO shop_audit (shop_id, value, user_id)
				VALUES ($1, $2, $3)
				ON CONFLICT (shop_id, value) DO UPDATE SET user_id = EXCLUDED.user_id
			`, shopId, constants.userTicket.types.shopDescription, this.userId),
			query(`
				INSERT INTO shop_audit (shop_id, value, user_id)
				VALUES ($1, $2, $3)
				ON CONFLICT (shop_id, value) DO UPDATE SET user_id = EXCLUDED.user_id
			`, shopId, constants.userTicket.types.shopImage, this.userId),
		]);

		// Add Services

		console.info('Creating services');

		// Get more info
		const [shopServices, [ownerRole]] = await Promise.all([
			query(`
				SELECT shop_default_service.id
				FROM shop_default_service
				JOIN shop_default_service_ac_game ON (shop_default_service.id = shop_default_service_ac_game.shop_default_service_id)
				WHERE shop_default_service_ac_game.game_id = ANY($1)
				GROUP BY shop_default_service.id
			`, games.map((g: any) => g.id)),
			query(`
				SELECT id
				FROM shop_role
				WHERE shop_id = $1 AND parent_id IS NULL
			`, shopId),
		]);

		const defaultServices = faker.helpers.arrayElements(shopServices);

		const serviceName = faker.commerce.productAdjective();
		const serviceDescription = faker.commerce.productDescription();

		const [[shopService]] = await Promise.all([
			query(`
				INSERT INTO shop_service (name, description, shop_id)
				VALUES ($1, $2, $3)
				RETURNING id
			`, serviceName, serviceDescription, shopId),
			Promise.all(
				defaultServices.map(async (service: any) =>
				{
					await query(`
						INSERT INTO shop_default_service_shop (shop_default_service_id, shop_id, active)
						VALUES ($1, $2, true)
						ON CONFLICT (shop_default_service_id, shop_id) DO UPDATE SET active = true
					`, service.id, shopId);
				}),
			),
		]);

		await Promise.all([
			games.map(async (game: any) =>
			{
				await query(`
					INSERT INTO shop_service_ac_game (shop_service_id, game_id)
					VALUES ($1, $2)
				`, shopService.id, game.id);
			}),
			query(`
				INSERT INTO shop_audit (shop_id, value, user_id)
				VALUES ($1, $2, $3)
				ON CONFLICT (shop_id, value) DO UPDATE SET user_id = EXCLUDED.user_id
			`, shopId, constants.userTicket.types.shopServiceName, this.userId),
			query(`
				INSERT INTO shop_audit (shop_id, value, user_id)
				VALUES ($1, $2, $3)
				ON CONFLICT (shop_id, value) DO UPDATE SET user_id = EXCLUDED.user_id
			`, shopId, constants.userTicket.types.shopServiceDescription, this.userId),
		]);

		// Add Roles, Users

		console.info('Creating roles');

		const numberOfDepartments = faker.number.int(4);
		let roleIds = [], shopEmployeeIds = [];

		for (let i = 0; i < numberOfDepartments; i++)
		{
			const departmentName = `Head of ${faker.commerce.department()}`;
			const departmentDescription = faker.commerce.productDescription();
			const departmentParentId = ownerRole.id;
			const departmentPositions = 1;
			const departmentApply = false;
			const departmentContact = true;
			const departmentActive = true;
			const departmentApplications = false;
			const departmentStats = true;

			const [role] = await query(`
				INSERT INTO shop_role (shop_id, name, description, parent_id, positions, apply, contact, active, applications, stats)
				VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
				RETURNING id
			`, shopId, departmentName, departmentDescription, departmentParentId, departmentPositions, departmentApply, departmentContact, departmentActive, departmentApplications, departmentStats);

			const roleId = role.id;
			roleIds.push(roleId);

			const roleUserId = (faker.helpers.arrayElement(staffUserIds) as any).id;
			shopEmployeeIds.push(roleUserId);
			staffUserIds = staffUserIds.filter((sui: any) => sui.id !== roleUserId);

			const [[shopUser]] = await Promise.all([
				query(`
					INSERT INTO shop_user (shop_id, user_id)
					VALUES ($1, $2)
					RETURNING id, active
				`, shopId, roleUserId),
				query(`
					INSERT INTO shop_role_service (shop_role_id, shop_service_id)
					VALUES ($1, $2)
				`, roleId, shopService.id),
				Promise.all([
					defaultServices.map(async (service: any) =>
					{
						await query(`
							INSERT INTO shop_role_default_service (shop_role_id, shop_default_service_id)
							VALUES ($1, $2)
						`, roleId, service.id);
					}),
				]),
				query(`
					INSERT INTO shop_audit (shop_id, value, user_id)
					VALUES ($1, $2, $3)
					ON CONFLICT (shop_id, value) DO UPDATE SET user_id = EXCLUDED.user_id
				`, shopId, constants.userTicket.types.shopRoleName, this.userId),
				query(`
					INSERT INTO shop_audit (shop_id, value, user_id)
					VALUES ($1, $2, $3)
					ON CONFLICT (shop_id, value) DO UPDATE SET user_id = EXCLUDED.user_id
				`, shopId, constants.userTicket.types.shopRoleDescription, this.userId),
				this.query('v1/user_lite', { id: roleUserId }),
			]);

			await Promise.all([
				query(`
					INSERT INTO shop_user_role (shop_role_id, shop_user_id)
					VALUES ($1, $2)
				`, roleId, shopUser.id),
			]);

			const numberOfUsers = faker.number.int(3);

			for (let j = 0; j < numberOfUsers; j++)
			{
				const roleName = faker.commerce.productName();
				const roleDescription = faker.commerce.productDescription();
				const roleParentId = roleId;
				const rolePositions = faker.number.int(3);
				const roleApply = true;
				const roleContact = false;
				const roleActive = true;
				const roleApplications = true;
				const roleStats = false;

				const [userRole] = await query(`
					INSERT INTO shop_role (shop_id, name, description, parent_id, positions, apply, contact, active, applications, stats)
					VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
					RETURNING id
				`, shopId, roleName, roleDescription, roleParentId, rolePositions, roleApply, roleContact, roleActive, roleApplications, roleStats);

				const userRoleId = userRole.id;

				const userRoleUserId = (faker.helpers.arrayElement(staffUserIds) as any).id;
				staffUserIds = staffUserIds.filter((sui: any) => sui.id !== userRoleUserId);

				const [[userShopUser]] = await Promise.all([
					query(`
						INSERT INTO shop_user (shop_id, user_id)
						VALUES ($1, $2)
						RETURNING id, active
					`, shopId, userRoleUserId),
					query(`
						INSERT INTO shop_role_service (shop_role_id, shop_service_id)
						VALUES ($1, $2)
					`, userRoleId, shopService.id),
					Promise.all([
						defaultServices.map(async (service: any) =>
						{
							await query(`
								INSERT INTO shop_role_default_service (shop_role_id, shop_default_service_id)
								VALUES ($1, $2)
							`, userRoleId, service.id);
						}),
					]),
					query(`
						INSERT INTO shop_audit (shop_id, value, user_id)
						VALUES ($1, $2, $3)
						ON CONFLICT (shop_id, value) DO UPDATE SET user_id = EXCLUDED.user_id
					`, shopId, constants.userTicket.types.shopRoleName, this.userId),
					query(`
						INSERT INTO shop_audit (shop_id, value, user_id)
						VALUES ($1, $2, $3)
						ON CONFLICT (shop_id, value) DO UPDATE SET user_id = EXCLUDED.user_id
					`, shopId, constants.userTicket.types.shopRoleDescription, this.userId),
					this.query('v1/user_lite', { id: userRoleUserId }),
				]);

				await Promise.all([
					query(`
						INSERT INTO shop_user_role (shop_role_id, shop_user_id)
						VALUES ($1, $2)
					`, userRoleId, userShopUser.id),
				]);
			}
		}

		// Shop Orders

		console.info('Creating orders');

		const numberOfOrders = faker.number.int(10);

		await Promise.all(
			Array(numberOfOrders).map(async () =>
			{
				// Create Order

				const defaultOrCustom = faker.datatype.boolean();
				let order;

				const orderUserId = (faker.helpers.arrayElement(staffUserIds) as any).id;

				const orderComment = faker.lorem.sentence();
				const gameId = (faker.helpers.arrayElement(games) as any).id;
				const ordered = faker.date.between({ from: 0, to: 1893456000000 });

				if (defaultOrCustom)
				{
					const serviceId = (faker.helpers.arrayElement(defaultServices) as any).id;

					[order] = await query(`
						INSERT INTO shop_order (shop_id, customer_id, shop_default_service_id, comment, game_id, ordered)
						VALUES ($1, $2, $3, $4, $5, $6)
						RETURNING id
					`, shopId, orderUserId, serviceId, orderComment, gameId, ordered);
				}
				else
				{
					[order] = await query(`
						INSERT INTO shop_order (shop_id, customer_id, shop_service_id, comment, game_id, ordered)
						VALUES ($1, $2, $3, $4, $5, $6)
						RETURNING id
					`, shopId, orderUserId, shopService.id, orderComment, gameId, ordered);
				}

				const catalogItems: ACGameItemType[number]['all']['items'] = (await ACCCache.get(`${constants.cacheKeys.sortedAcGameCategories}_${gameId}_all_items`)).filter((item: any) => item.tradeable);

				const items = faker.helpers.arrayElements(catalogItems, 5);

				await Promise.all(
					items.map(async (item: any) =>
					{
						const quantity = faker.string.numeric({ length: 1, exclude: ['0'] });

						await query(`
							INSERT INTO shop_order_catalog_item (shop_order_id, catalog_item_id, quantity)
							VALUES ($1, $2, $3)
						`, order.id, item.id, quantity);
					}),
				);

				await this.query('v1/user_lite', { id: orderUserId });

				// Claim Order

				const claimUsers = await query(`
					SELECT shop_user.user_id
					FROM shop_order
					LEFT JOIN shop_default_service ON (shop_default_service.id = shop_order.shop_default_service_id)
					LEFT JOIN shop_service ON (shop_service.id = shop_order.shop_service_id)
					LEFT JOIN shop_role_service ON (shop_role_service.shop_service_id = shop_service.id)
					LEFT JOIN shop_role_default_service ON (shop_role_default_service.shop_default_service_id = shop_default_service.id)
					JOIN shop_user_role ON (shop_user_role.shop_role_id = shop_role_service.shop_role_id OR shop_user_role.shop_role_id = shop_role_default_service.shop_role_id)
					JOIN shop_user ON (shop_user.id = shop_user_role.shop_user_id)
					WHERE shop_user.active = true AND shop_order.id = $1
					GROUP BY shop_user.user_id
				`, order.id);

				const employeeId = (faker.helpers.arrayElement(claimUsers) as any).user_id;
				const orderTitle = `Order #${order.id}`;
				const orderText = faker.lorem.sentence();
				const orderFormat = 'plaintext';

				const [thread] = await query(`
					INSERT INTO node (parent_node_id, user_id, type)
					VALUES ($1::int, $2::int, $3::node_type)
					RETURNING id
				`, constants.boardIds.shopThread, employeeId, 'thread');

				await query(`
					INSERT INTO node_revision (node_id, reviser_id, title)
					VALUES ($1::int, $2::int, $3::text)
				`, thread.id, employeeId, orderTitle);

				const [message] = await query(`
					INSERT INTO node (parent_node_id, user_id, type)
					VALUES ($1::int, $2::int, $3::node_type)
					RETURNING id
				`, thread.id, employeeId, 'post');

				await query(`
					INSERT INTO node_revision (node_id, reviser_id, content, content_format)
					VALUES ($1::int, $2::int, $3::text, $4::node_content_format)
				`, message.id, employeeId, orderText, orderFormat);

				let userIds = [];
				userIds.push(orderUserId);

				let employeeIds = [];
				employeeIds.push(employeeId);

				const [owners, chain] = await Promise.all([
					query(`
						SELECT shop_user.user_id
						FROM shop_user
						JOIN shop_user_role ON (shop_user_role.shop_user_id = shop_user.id)
						JOIN shop_role ON (shop_role.id = shop_user_role.shop_role_id)
						WHERE shop_user.shop_id = $1 AND shop_user.active = true AND shop_role.parent_id IS NULL
					`, shopId),
					query(`
						WITH RECURSIVE Descendants AS
						(
							SELECT shop_role.parent_id, shop_role.id, shop_user.user_id
							FROM shop_role
							JOIN shop_user_role ON (shop_role.id = shop_user_role.shop_role_id)
							JOIN shop_user ON (shop_user_role.shop_user_id = shop_user.id)
							WHERE shop_role.shop_id = $1 AND shop_user.active = true AND shop_user.user_id = $2
							UNION ALL
							SELECT shop_role.parent_id, shop_role.id, shop_user.user_id
							FROM shop_role
							JOIN shop_user_role ON (shop_role.id = shop_user_role.shop_role_id)
							JOIN shop_user ON (shop_user_role.shop_user_id = shop_user.id)
							JOIN Descendants D ON (D.parent_id = shop_role.id)
						)
						SELECT distinct user_id from Descendants
					`, shopId, employeeId),
				]);

				owners.concat(chain).map((user: any) =>
				{
					if (!employeeIds.includes(user.user_id))
					{
						employeeIds.push(user.user_id);
					}
				});

				await Promise.all([
					userIds.map(async (userId) =>
					{
						await query(`
							INSERT INTO user_node_permission (user_id, node_id, node_permission_id, granted)
							VALUES ($1::int, $2::int, $3::int, true)
							ON CONFLICT ON CONSTRAINT user_node_permission_pkey DO NOTHING
						`, userId, thread.id, constants.nodePermissions.read);

						await query(`
							INSERT INTO user_node_permission (user_id, node_id, node_permission_id, granted)
							VALUES ($1::int, $2::int, $3::int, true)
							ON CONFLICT ON CONSTRAINT user_node_permission_pkey DO NOTHING
						`, userId, thread.id, constants.nodePermissions.reply);
					}),
					employeeIds.map(async (userId) =>
					{
						await query(`
							INSERT INTO user_node_permission (user_id, node_id, node_permission_id, granted)
							VALUES ($1::int, $2::int, $3::int, true)
							ON CONFLICT ON CONSTRAINT user_node_permission_pkey DO NOTHING
						`, userId, thread.id, constants.nodePermissions.read);

						await query(`
							INSERT INTO user_node_permission (user_id, node_id, node_permission_id, granted)
							VALUES ($1::int, $2::int, $3::int, true)
							ON CONFLICT ON CONSTRAINT user_node_permission_pkey DO NOTHING
						`, userId, thread.id, constants.nodePermissions.reply);

						await query(`
							INSERT INTO user_node_permission (user_id, node_id, node_permission_id, granted)
							VALUES ($1::int, $2::int, $3::int, true)
							ON CONFLICT ON CONSTRAINT user_node_permission_pkey DO NOTHING
						`, userId, thread.id, constants.nodePermissions.lock);

						await query(`
							INSERT INTO user_node_permission (user_id, node_id, node_permission_id, granted)
							VALUES ($1::int, $2::int, $3::int, true)
							ON CONFLICT ON CONSTRAINT user_node_permission_pkey DO NOTHING
						`, userId, thread.id, constants.nodePermissions.addUsers);

						await query(`
							INSERT INTO user_node_permission (user_id, node_id, node_permission_id, granted)
							VALUES ($1::int, $2::int, $3::int, true)
							ON CONFLICT ON CONSTRAINT user_node_permission_pkey DO NOTHING
						`, userId, thread.id, constants.nodePermissions.removeUsers);
					}),
				]);

				await query(`
					UPDATE shop_order
					SET employee_id = $1, node_id = $3
					WHERE id = $2
				`, employeeId, order.id, thread.id);

				await query(`
					INSERT INTO shop_node (shop_id, node_id)
					VALUES ($1, $2)
				`, shopId, thread.id);

				// Complete Order

				for (let j = 0; j < 5; j++)
				{
					const postUserId = faker.helpers.arrayElement([employeeId, orderUserId]);
					const postText = faker.lorem.sentences();

					const [post] = await query(`
						INSERT INTO node (parent_node_id, user_id, type)
						VALUES ($1::int, $2::int, $3::node_type)
						RETURNING id
					`, thread.id, postUserId, 'post');

					await query(`
						INSERT INTO node_revision (node_id, reviser_id, title, content, content_format)
						VALUES ($1::int, $2::int, $3, $4::text, $5::node_content_format)
					`, post.id, postUserId, null, postText, 'plaintext');
				}

				await query(`
					UPDATE node
					SET locked = now()
					WHERE id = $1::int
				`, thread.id);

				await query(`
					UPDATE shop_order
					SET completed = NOW()
					WHERE id = $1::int
				`, order.id);

				const ratingConfig = constants.rating.configs;

				const ratingIds = [ratingConfig.positive.id, ratingConfig.neutral.id, ratingConfig.negative.id];

				await query(`
					INSERT INTO rating (user_id, rating_user_id, rating, comment, shop_node_id)
					VALUES ($1::int, $2::int, $3, $4::text, $5)
					RETURNING id
				`, orderUserId, employeeId, faker.helpers.arrayElement(ratingIds), faker.lorem.sentence(), thread.id);
			}),
		);

		// Shop Applications

		console.info('Creating applications');

		const numberOfApplications = faker.number.int(10);

		await Promise.all(
			Array(numberOfApplications).map(async () =>
			{
				// Create Application

				const applicationUserId = (faker.helpers.arrayElement(staffUserIds) as any).id;
				const applicationText = faker.lorem.sentence();
				const applicationRoleId = faker.helpers.arrayElement(roleIds);

				const [shopApplication] = await query(`
					INSERT INTO shop_application (shop_id, user_id, shop_role_id, application, application_format)
					VALUES ($1, $2, $3, $4, $5)
					RETURNING id
				`, shopId, applicationUserId, applicationRoleId, applicationText, 'plaintext');

				await Promise.all([
					games.map(async (game: any) =>
					{
						await query(`
							INSERT INTO shop_application_ac_game (shop_application_id, game_id)
							VALUES ($1, $2)
						`, shopApplication.id, game.id);
					}),
				]);

				await this.query('v1/user_lite', { id: applicationUserId });

				// No need to complete it
			}),
		);

		// Shop Threads

		console.info('Creating shop threads');

		const numberOfThreads = faker.number.int(10);

		for (let i = 0; i < numberOfThreads; i++)
		{
			// Create Thread

			const employeeId = faker.helpers.arrayElement(shopEmployeeIds);
			const customerId = (faker.helpers.arrayElement(staffUserIds) as any).id;
			const threadTitle = faker.lorem.words();
			const threadText = faker.lorem.sentences();

			const [thread] = await query(`
				INSERT INTO node (parent_node_id, user_id, type)
				VALUES ($1::int, $2::int, $3::node_type)
				RETURNING id
			`, constants.boardIds.shopThread, employeeId, 'thread');

			await query(`
				INSERT INTO node_revision (node_id, reviser_id, title)
				VALUES ($1::int, $2::int, $3::text)
			`, thread.id, employeeId, threadTitle);

			const [message] = await query(`
				INSERT INTO node (parent_node_id, user_id, type)
				VALUES ($1::int, $2::int, $3::node_type)
				RETURNING id
			`, thread.id, employeeId, 'post');

			await query(`
				INSERT INTO node_revision (node_id, reviser_id, content, content_format)
				VALUES ($1::int, $2::int, $3::text, $4::node_content_format)
			`, message.id, employeeId, threadText, 'plaintext');

			let userIds = [];
			userIds.push(customerId);

			let employeeIds = [];
			employeeIds.push(employeeId);

			const [owners, chain] = await Promise.all([
				query(`
					SELECT shop_user.user_id
					FROM shop_user
					JOIN shop_user_role ON (shop_user_role.shop_user_id = shop_user.id)
					JOIN shop_role ON (shop_role.id = shop_user_role.shop_role_id)
					WHERE shop_user.shop_id = $1 AND shop_user.active = true AND shop_role.parent_id IS NULL
				`, shopId),
				query(`
					WITH RECURSIVE Descendants AS
					(
						SELECT shop_role.parent_id, shop_role.id, shop_user.user_id
						FROM shop_role
						JOIN shop_user_role ON (shop_role.id = shop_user_role.shop_role_id)
						JOIN shop_user ON (shop_user_role.shop_user_id = shop_user.id)
						WHERE shop_role.shop_id = $1 AND shop_user.active = true AND shop_user.user_id = $2
						UNION ALL
						SELECT shop_role.parent_id, shop_role.id, shop_user.user_id
						FROM shop_role
						JOIN shop_user_role ON (shop_role.id = shop_user_role.shop_role_id)
						JOIN shop_user ON (shop_user_role.shop_user_id = shop_user.id)
						JOIN Descendants D ON (D.parent_id = shop_role.id)
					)
					SELECT distinct user_id from Descendants
				`, shopId, employeeId),
				this.query('v1/user_lite', { id: customerId }),
			]);

			owners.concat(chain).map((user: any) =>
			{
				if (!employeeIds.includes(user.user_id))
				{
					employeeIds.push(user.user_id);
				}
			});

			await Promise.all([
				userIds.map(async (userId) =>
				{
					await query(`
						INSERT INTO user_node_permission (user_id, node_id, node_permission_id, granted)
						VALUES ($1::int, $2::int, $3::int, true)
						ON CONFLICT ON CONSTRAINT user_node_permission_pkey DO NOTHING
					`, userId, thread.id, constants.nodePermissions.read);

					await query(`
						INSERT INTO user_node_permission (user_id, node_id, node_permission_id, granted)
						VALUES ($1::int, $2::int, $3::int, true)
						ON CONFLICT ON CONSTRAINT user_node_permission_pkey DO NOTHING
					`, userId, thread.id, constants.nodePermissions.reply);
				}),
				employeeIds.map(async (userId) =>
				{
					await query(`
						INSERT INTO user_node_permission (user_id, node_id, node_permission_id, granted)
						VALUES ($1::int, $2::int, $3::int, true)
						ON CONFLICT ON CONSTRAINT user_node_permission_pkey DO NOTHING
					`, userId, thread.id, constants.nodePermissions.read);

					await query(`
						INSERT INTO user_node_permission (user_id, node_id, node_permission_id, granted)
						VALUES ($1::int, $2::int, $3::int, true)
						ON CONFLICT ON CONSTRAINT user_node_permission_pkey DO NOTHING
					`, userId, thread.id, constants.nodePermissions.reply);

					await query(`
						INSERT INTO user_node_permission (user_id, node_id, node_permission_id, granted)
						VALUES ($1::int, $2::int, $3::int, true)
						ON CONFLICT ON CONSTRAINT user_node_permission_pkey DO NOTHING
					`, userId, thread.id, constants.nodePermissions.lock);

					await query(`
						INSERT INTO user_node_permission (user_id, node_id, node_permission_id, granted)
						VALUES ($1::int, $2::int, $3::int, true)
						ON CONFLICT ON CONSTRAINT user_node_permission_pkey DO NOTHING
					`, userId, thread.id, constants.nodePermissions.addUsers);

					await query(`
						INSERT INTO user_node_permission (user_id, node_id, node_permission_id, granted)
						VALUES ($1::int, $2::int, $3::int, true)
						ON CONFLICT ON CONSTRAINT user_node_permission_pkey DO NOTHING
					`, userId, thread.id, constants.nodePermissions.removeUsers);
				}),
			]);

			await query(`
				INSERT INTO shop_node (shop_id, node_id)
				VALUES ($1, $2)
			`, shopId, thread.id);

			// Do some posts

			for (let j = 0; j < 5; j++)
			{
				const postUserId = faker.helpers.arrayElement([employeeId, customerId]);
				const postText = faker.lorem.sentences();

				const [post] = await query(`
					INSERT INTO node (parent_node_id, user_id, type)
					VALUES ($1::int, $2::int, $3::node_type)
					RETURNING id
				`, thread.id, postUserId, 'post');

				await query(`
					INSERT INTO node_revision (node_id, reviser_id, title, content, content_format)
					VALUES ($1::int, $2::int, $3, $4::text, $5::node_content_format)
				`, post.id, postUserId, null, postText, 'plaintext');
			}
		}
	});

	return {
		_success: `Your shop has been created!`,
	};
}
