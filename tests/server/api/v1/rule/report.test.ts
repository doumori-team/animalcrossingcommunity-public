import { describe, test, expect, vi } from 'vitest';

import report from 'server/api/v1/rule/report';
import { UserError } from '@errors';
import { constants } from '@utils';
import * as APITypes from '@apiTypes';
import * as APIPerms from '@apiPerms';
import { mockAPIContext, mockDbQuery } from 'tests/vitest.setup.ts';

const data = {
	referenceId: '59483',
	type: constants.userTicket.types.post,
};

const expectedAPIData = {
	referenceId: 59483,
	type: constants.userTicket.types.post,
};

describe('report API function', () =>
{
	test('api tests are converted correctly', async () =>
	{
		// Arrange & Act
		const apiData = await APITypes.parse.bind(mockAPIContext)(report.apiTypes, data);

		// Assert
		expect(apiData).toEqual(expectedAPIData);
	});

	test('should throw error if user lacks permission', async () =>
	{
		// Arrange
		mockAPIContext.query.mockResolvedValueOnce(false);

		// Act & Assert
		await expect(APIPerms.check.call(mockAPIContext, report.permissions)).rejects.toThrow(new UserError('permission'));
	});

	test('should throw error if user is not logged in', async () =>
	{
		// Arrange
		const tempAPIContext = {
			userId: null,
			query: vi.fn(),
			fullQuery: vi.fn(),
		};

		tempAPIContext.query.mockResolvedValueOnce(true);

		// Act & Assert
		await expect(APIPerms.check.call(tempAPIContext, report.permissions)).rejects.toThrow(new UserError('login-needed'));
	});

	test('should throw error if post not found', async () =>
	{
		// Arrange
		const tempData = {
			...data,
			type: constants.userTicket.types.post,
		};

		const apiData = await APITypes.parse.bind(mockAPIContext)(report.apiTypes, tempData);

		mockDbQuery.mockResolvedValueOnce([{ id: 84738 }]);
		mockDbQuery.mockResolvedValueOnce([]);

		// Act & Assert
		await expect(report.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('no-such-node'));
	});

	test('should throw error if thread not found', async () =>
	{
		// Arrange
		const tempData = {
			...data,
			type: constants.userTicket.types.thread,
		};

		const apiData = await APITypes.parse.bind(mockAPIContext)(report.apiTypes, tempData);

		mockDbQuery.mockResolvedValueOnce([{ id: 84738 }]);
		mockDbQuery.mockResolvedValueOnce([]);

		// Act & Assert
		await expect(report.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('no-such-node'));
	});

	test('should throw error if pattern not found', async () =>
	{
		// Arrange
		const tempData = {
			...data,
			type: constants.userTicket.types.pattern,
		};

		const apiData = await APITypes.parse.bind(mockAPIContext)(report.apiTypes, tempData);

		mockDbQuery.mockResolvedValueOnce([{ id: 84738 }]);
		mockDbQuery.mockResolvedValueOnce([]);

		// Act & Assert
		await expect(report.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('no-such-pattern'));
	});

	test('should throw error if post image not found', async () =>
	{
		// Arrange
		const tempData = {
			...data,
			type: constants.userTicket.types.postImage,
		};

		const apiData = await APITypes.parse.bind(mockAPIContext)(report.apiTypes, tempData);

		mockDbQuery.mockResolvedValueOnce([{ id: 84738 }]);
		mockDbQuery.mockResolvedValueOnce([]);

		// Act & Assert
		await expect(report.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('no-such-file'));
	});

	test('should throw error if profile image not found', async () =>
	{
		// Arrange
		const tempData = {
			...data,
			type: constants.userTicket.types.profileImage,
		};

		const apiData = await APITypes.parse.bind(mockAPIContext)(report.apiTypes, tempData);

		mockDbQuery.mockResolvedValueOnce([{ id: 84738 }]);
		mockDbQuery.mockResolvedValueOnce([]);

		// Act & Assert
		await expect(report.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('no-such-file'));
	});

	test('should throw error if town flag not found', async () =>
	{
		// Arrange
		const tempData = {
			...data,
			type: constants.userTicket.types.townFlag,
		};

		const apiData = await APITypes.parse.bind(mockAPIContext)(report.apiTypes, tempData);

		mockDbQuery.mockResolvedValueOnce([{ id: 84738 }]);
		mockDbQuery.mockResolvedValueOnce([]);

		// Act & Assert
		await expect(report.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('no-such-pattern'));
	});

	test('should throw error if tune not found', async () =>
	{
		// Arrange
		const tempData = {
			...data,
			type: constants.userTicket.types.tune,
		};

		const apiData = await APITypes.parse.bind(mockAPIContext)(report.apiTypes, tempData);

		mockDbQuery.mockResolvedValueOnce([{ id: 84738 }]);
		mockDbQuery.mockResolvedValueOnce([]);

		// Act & Assert
		await expect(report.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('no-such-tune'));
	});

	test('should throw error if town tune not found', async () =>
	{
		// Arrange
		const tempData = {
			...data,
			type: constants.userTicket.types.townTune,
		};

		const apiData = await APITypes.parse.bind(mockAPIContext)(report.apiTypes, tempData);

		mockDbQuery.mockResolvedValueOnce([{ id: 84738 }]);
		mockDbQuery.mockResolvedValueOnce([]);

		// Act & Assert
		await expect(report.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('no-such-tune'));
	});

	test('should throw error if town not found', async () =>
	{
		// Arrange
		const tempData = {
			...data,
			type: constants.userTicket.types.town,
		};

		const apiData = await APITypes.parse.bind(mockAPIContext)(report.apiTypes, tempData);

		mockDbQuery.mockResolvedValueOnce([{ id: 84738 }]);
		mockDbQuery.mockResolvedValueOnce([]);

		// Act & Assert
		await expect(report.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('no-such-town'));
	});

	test('should throw error if character not found', async () =>
	{
		// Arrange
		const tempData = {
			...data,
			type: constants.userTicket.types.character,
		};

		const apiData = await APITypes.parse.bind(mockAPIContext)(report.apiTypes, tempData);

		mockDbQuery.mockResolvedValueOnce([{ id: 84738 }]);
		mockDbQuery.mockResolvedValueOnce([]);

		// Act & Assert
		await expect(report.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('no-such-character'));
	});

	test('should throw error if rating not found', async () =>
	{
		// Arrange
		const tempData = {
			...data,
			type: constants.userTicket.types.rating,
		};

		const apiData = await APITypes.parse.bind(mockAPIContext)(report.apiTypes, tempData);

		mockDbQuery.mockResolvedValueOnce([{ id: 84738 }]);
		mockDbQuery.mockResolvedValueOnce([]);

		// Act & Assert
		await expect(report.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('no-such-rating'));
	});

	test('should throw error if listing not found', async () =>
	{
		// Arrange
		const tempData = {
			...data,
			type: constants.userTicket.types.listing,
		};

		const apiData = await APITypes.parse.bind(mockAPIContext)(report.apiTypes, tempData);

		mockDbQuery.mockResolvedValueOnce([{ id: 84738 }]);
		mockDbQuery.mockResolvedValueOnce([]);

		// Act & Assert
		await expect(report.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('no-such-listing'));
	});

	test('should throw error if listing offer not found', async () =>
	{
		// Arrange
		const tempData = {
			...data,
			type: constants.userTicket.types.listing,
		};

		const apiData = await APITypes.parse.bind(mockAPIContext)(report.apiTypes, tempData);

		mockDbQuery.mockResolvedValueOnce([{ id: 84738 }]);
		mockDbQuery.mockResolvedValueOnce([{ creator_id: constants.accUserId }]);
		mockDbQuery.mockResolvedValueOnce([]);

		// Act & Assert
		await expect(report.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('no-such-listing-offer'));
	});

	test('should throw error if listing comment not found', async () =>
	{
		// Arrange
		const tempData = {
			...data,
			type: constants.userTicket.types.listingComment,
		};

		const apiData = await APITypes.parse.bind(mockAPIContext)(report.apiTypes, tempData);

		mockDbQuery.mockResolvedValueOnce([{ id: 84738 }]);
		mockDbQuery.mockResolvedValueOnce([]);

		// Act & Assert
		await expect(report.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('no-such-listing-comment'));
	});

	test('should throw error if offer not found', async () =>
	{
		// Arrange
		const tempData = {
			...data,
			type: constants.userTicket.types.offer,
		};

		const apiData = await APITypes.parse.bind(mockAPIContext)(report.apiTypes, tempData);

		mockDbQuery.mockResolvedValueOnce([{ id: 84738 }]);
		mockDbQuery.mockResolvedValueOnce([]);

		// Act & Assert
		await expect(report.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('no-such-offer'));
	});

	test('should throw error if shop not found (name)', async () =>
	{
		// Arrange
		const tempData = {
			...data,
			type: constants.userTicket.types.shopName,
		};

		const apiData = await APITypes.parse.bind(mockAPIContext)(report.apiTypes, tempData);

		mockDbQuery.mockResolvedValueOnce([{ id: 84738 }]);
		mockDbQuery.mockResolvedValueOnce([]);

		// Act & Assert
		await expect(report.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('no-such-shop'));
	});

	test('should throw error if shop not found (description)', async () =>
	{
		// Arrange
		const tempData = {
			...data,
			type: constants.userTicket.types.shopDescription,
		};

		const apiData = await APITypes.parse.bind(mockAPIContext)(report.apiTypes, tempData);

		mockDbQuery.mockResolvedValueOnce([{ id: 84738 }]);
		mockDbQuery.mockResolvedValueOnce([]);

		// Act & Assert
		await expect(report.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('no-such-shop'));
	});

	test('should throw error if shop not found (short description)', async () =>
	{
		// Arrange
		const tempData = {
			...data,
			type: constants.userTicket.types.shopShortDescription,
		};

		const apiData = await APITypes.parse.bind(mockAPIContext)(report.apiTypes, tempData);

		mockDbQuery.mockResolvedValueOnce([{ id: 84738 }]);
		mockDbQuery.mockResolvedValueOnce([]);

		// Act & Assert
		await expect(report.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('no-such-shop'));
	});

	test('should throw error if shop not found (image)', async () =>
	{
		// Arrange
		const tempData = {
			...data,
			type: constants.userTicket.types.shopImage,
		};

		const apiData = await APITypes.parse.bind(mockAPIContext)(report.apiTypes, tempData);

		mockDbQuery.mockResolvedValueOnce([{ id: 84738 }]);
		mockDbQuery.mockResolvedValueOnce([]);

		// Act & Assert
		await expect(report.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('no-such-shop'));
	});

	test('should throw error if shop service not found (name)', async () =>
	{
		// Arrange
		const tempData = {
			...data,
			type: constants.userTicket.types.shopServiceName,
		};

		const apiData = await APITypes.parse.bind(mockAPIContext)(report.apiTypes, tempData);

		mockDbQuery.mockResolvedValueOnce([{ id: 84738 }]);
		mockDbQuery.mockResolvedValueOnce([]);

		// Act & Assert
		await expect(report.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('no-such-service'));
	});

	test('should throw error if shop service not found (description)', async () =>
	{
		// Arrange
		const tempData = {
			...data,
			type: constants.userTicket.types.shopServiceDescription,
		};

		const apiData = await APITypes.parse.bind(mockAPIContext)(report.apiTypes, tempData);

		mockDbQuery.mockResolvedValueOnce([{ id: 84738 }]);
		mockDbQuery.mockResolvedValueOnce([]);

		// Act & Assert
		await expect(report.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('no-such-service'));
	});

	test('should throw error if shop role not found (name)', async () =>
	{
		// Arrange
		const tempData = {
			...data,
			type: constants.userTicket.types.shopRoleName,
		};

		const apiData = await APITypes.parse.bind(mockAPIContext)(report.apiTypes, tempData);

		mockDbQuery.mockResolvedValueOnce([{ id: 84738 }]);
		mockDbQuery.mockResolvedValueOnce([]);

		// Act & Assert
		await expect(report.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('no-such-role'));
	});

	test('should throw error if shop role not found (description)', async () =>
	{
		// Arrange
		const tempData = {
			...data,
			type: constants.userTicket.types.shopRoleDescription,
		};

		const apiData = await APITypes.parse.bind(mockAPIContext)(report.apiTypes, tempData);

		mockDbQuery.mockResolvedValueOnce([{ id: 84738 }]);
		mockDbQuery.mockResolvedValueOnce([]);

		// Act & Assert
		await expect(report.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('no-such-role'));
	});

	test('should throw error if shop order not found', async () =>
	{
		// Arrange
		const tempData = {
			...data,
			type: constants.userTicket.types.shopOrder,
		};

		const apiData = await APITypes.parse.bind(mockAPIContext)(report.apiTypes, tempData);

		mockDbQuery.mockResolvedValueOnce([{ id: 84738 }]);
		mockDbQuery.mockResolvedValueOnce([]);

		// Act & Assert
		await expect(report.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('no-such-order'));
	});

	test('should throw error if shop application not found', async () =>
	{
		// Arrange
		const tempData = {
			...data,
			type: constants.userTicket.types.shopApplication,
		};

		const apiData = await APITypes.parse.bind(mockAPIContext)(report.apiTypes, tempData);

		mockDbQuery.mockResolvedValueOnce([{ id: 84738 }]);
		mockDbQuery.mockResolvedValueOnce([]);

		// Act & Assert
		await expect(report.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('no-such-application'));
	});

	test('should throw error if user not found (profile location)', async () =>
	{
		// Arrange
		const tempData = {
			...data,
			type: constants.userTicket.types.profileLocation,
		};

		const apiData = await APITypes.parse.bind(mockAPIContext)(report.apiTypes, tempData);

		mockDbQuery.mockResolvedValueOnce([{ id: 84738 }]);
		mockDbQuery.mockResolvedValueOnce([]);

		// Act & Assert
		await expect(report.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('no-such-user'));
	});

	test('should throw error if user not found (profile signature)', async () =>
	{
		// Arrange
		const tempData = {
			...data,
			type: constants.userTicket.types.profileSignature,
		};

		const apiData = await APITypes.parse.bind(mockAPIContext)(report.apiTypes, tempData);

		mockDbQuery.mockResolvedValueOnce([{ id: 84738 }]);
		mockDbQuery.mockResolvedValueOnce([]);

		// Act & Assert
		await expect(report.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('no-such-user'));
	});

	test('should throw error if user not found (profile name)', async () =>
	{
		// Arrange
		const tempData = {
			...data,
			type: constants.userTicket.types.profileName,
		};

		const apiData = await APITypes.parse.bind(mockAPIContext)(report.apiTypes, tempData);

		mockDbQuery.mockResolvedValueOnce([{ id: 84738 }]);
		mockDbQuery.mockResolvedValueOnce([]);

		// Act & Assert
		await expect(report.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('no-such-user'));
	});

	test('should throw error if user not found (profile bio)', async () =>
	{
		// Arrange
		const tempData = {
			...data,
			type: constants.userTicket.types.profileBio,
		};

		const apiData = await APITypes.parse.bind(mockAPIContext)(report.apiTypes, tempData);

		mockDbQuery.mockResolvedValueOnce([{ id: 84738 }]);
		mockDbQuery.mockResolvedValueOnce([]);

		// Act & Assert
		await expect(report.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('no-such-user'));
	});

	test('should throw error if user not found (profile username)', async () =>
	{
		// Arrange
		const tempData = {
			...data,
			type: constants.userTicket.types.profileUsername,
		};

		const apiData = await APITypes.parse.bind(mockAPIContext)(report.apiTypes, tempData);

		mockDbQuery.mockResolvedValueOnce([{ id: 84738 }]);
		mockDbQuery.mockResolvedValueOnce([]);

		// Act & Assert
		await expect(report.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('no-such-user'));
	});

	test('should throw error if user not found (user title)', async () =>
	{
		// Arrange
		const tempData = {
			...data,
			type: constants.userTicket.types.profileUserTitle,
		};

		const apiData = await APITypes.parse.bind(mockAPIContext)(report.apiTypes, tempData);

		mockDbQuery.mockResolvedValueOnce([{ id: 84738 }]);
		mockDbQuery.mockResolvedValueOnce([]);

		// Act & Assert
		await expect(report.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('no-such-user'));
	});

	test('should throw error if type not listed', async () =>
	{
		// Arrange
		const tempData = {
			...data,
			type: 'RandomType',
		};

		const apiData = await APITypes.parse.bind(mockAPIContext)(report.apiTypes, tempData);

		mockDbQuery.mockResolvedValueOnce([{ id: 84738 }]);

		// Act & Assert
		await expect(report.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('bad-format'));
	});

	test('should report content', async () =>
	{
		// Arrange
		const apiData = await APITypes.parse.bind(mockAPIContext)(report.apiTypes, data);

		mockDbQuery.mockResolvedValueOnce([{ id: 84738 }]);
		mockDbQuery.mockResolvedValueOnce([{ user_id: constants.accUserId, title: null, content: 'Random Content', content_format: 'markdown' }]);
		mockDbQuery.mockResolvedValueOnce([]);
		mockAPIContext.query.mockResolvedValueOnce(false);
		mockAPIContext.query.mockResolvedValueOnce(false);
		mockAPIContext.query.mockResolvedValueOnce({ group: { identifier: constants.groupIdentifiers.user } });
		mockDbQuery.mockResolvedValueOnce([{ id: 48393 }]);
		mockDbQuery.mockResolvedValueOnce([]);
		mockDbQuery.mockResolvedValueOnce([]);
		mockAPIContext.query.mockResolvedValueOnce(null);

		// Act
		const result = await report.call(mockAPIContext, apiData);

		// Assert
		expect(result).toEqual({
			_successImage: constants.allImages['icons/icon_check.png'],
		});
	});

	test('should report content if ticket already exists', async () =>
	{
		// Arrange
		const apiData = await APITypes.parse.bind(mockAPIContext)(report.apiTypes, data);

		mockDbQuery.mockResolvedValueOnce([{ id: 84738 }]);
		mockDbQuery.mockResolvedValueOnce([{ user_id: constants.accUserId, title: null, content: 'Random Content', content_format: 'markdown' }]);
		mockDbQuery.mockResolvedValueOnce([{ id: 48393 }]);
		mockDbQuery.mockResolvedValueOnce([]);
		mockDbQuery.mockResolvedValueOnce([]);
		mockAPIContext.query.mockResolvedValueOnce(null);

		// Act
		const result = await report.call(mockAPIContext, apiData);

		// Assert
		expect(result).toEqual({
			_successImage: constants.allImages['icons/icon_check.png'],
		});
	});

	test('should report content if user submits multiple times', async () =>
	{
		// Arrange
		const apiData = await APITypes.parse.bind(mockAPIContext)(report.apiTypes, data);

		mockDbQuery.mockResolvedValueOnce([{ id: 84738 }]);
		mockDbQuery.mockResolvedValueOnce([{ user_id: constants.accUserId, title: null, content: 'Random Content', content_format: 'markdown' }]);
		mockDbQuery.mockResolvedValueOnce([{ id: 48393 }]);
		mockDbQuery.mockResolvedValueOnce([{ id: 94383 }]);

		// Act
		const result = await report.call(mockAPIContext, apiData);

		// Assert
		expect(result).toEqual({
			_successImage: constants.allImages['icons/icon_check.png'],
		});
	});

	test('should report content and assign to mod', async () =>
	{
		// Arrange
		const apiData = await APITypes.parse.bind(mockAPIContext)(report.apiTypes, data);

		mockDbQuery.mockResolvedValueOnce([{ id: 84738 }]);
		mockDbQuery.mockResolvedValueOnce([{ user_id: constants.accUserId, title: null, content: 'Random Content', content_format: 'markdown' }]);
		mockDbQuery.mockResolvedValueOnce([]);
		mockAPIContext.query.mockResolvedValueOnce(true);
		mockAPIContext.query.mockResolvedValueOnce(false);
		mockAPIContext.query.mockResolvedValueOnce({ group: { identifier: constants.groupIdentifiers.user } });
		mockDbQuery.mockResolvedValueOnce([{ id: 48393 }]);
		mockDbQuery.mockResolvedValueOnce([]);
		mockDbQuery.mockResolvedValueOnce([]);

		// Act
		const result = await report.call(mockAPIContext, apiData);

		// Assert
		expect(result).toEqual({
			_successImage: constants.allImages['icons/icon_check.png'],
		});
	});

	test('should report content and assign to admin', async () =>
	{
		// Arrange
		const apiData = await APITypes.parse.bind(mockAPIContext)(report.apiTypes, data);

		mockDbQuery.mockResolvedValueOnce([{ id: 84738 }]);
		mockDbQuery.mockResolvedValueOnce([{ user_id: constants.accUserId, title: null, content: 'Random Content', content_format: 'markdown' }]);
		mockDbQuery.mockResolvedValueOnce([]);
		mockAPIContext.query.mockResolvedValueOnce(true);
		mockAPIContext.query.mockResolvedValueOnce(true);
		mockAPIContext.query.mockResolvedValueOnce({ group: { identifier: constants.staffIdentifiers.mod } });
		mockDbQuery.mockResolvedValueOnce([{ id: 48393 }]);
		mockDbQuery.mockResolvedValueOnce([]);
		mockDbQuery.mockResolvedValueOnce([]);

		// Act
		const result = await report.call(mockAPIContext, apiData);

		// Assert
		expect(result).toEqual({
			_successImage: constants.allImages['icons/icon_check.png'],
		});
	});

	test('should report content and not assign to mod if admin', async () =>
	{
		// Arrange
		const apiData = await APITypes.parse.bind(mockAPIContext)(report.apiTypes, data);

		mockDbQuery.mockResolvedValueOnce([{ id: 84738 }]);
		mockDbQuery.mockResolvedValueOnce([{ user_id: constants.accUserId, title: null, content: 'Random Content', content_format: 'markdown' }]);
		mockDbQuery.mockResolvedValueOnce([]);
		mockAPIContext.query.mockResolvedValueOnce(true);
		mockAPIContext.query.mockResolvedValueOnce(false);
		mockAPIContext.query.mockResolvedValueOnce({ group: { identifier: constants.staffIdentifiers.admin } });
		mockDbQuery.mockResolvedValueOnce([{ id: 48393 }]);
		mockDbQuery.mockResolvedValueOnce([]);
		mockDbQuery.mockResolvedValueOnce([]);
		mockAPIContext.query.mockResolvedValueOnce(null);

		// Act
		const result = await report.call(mockAPIContext, apiData);

		// Assert
		expect(result).toEqual({
			_successImage: constants.allImages['icons/icon_check.png'],
		});
	});

	test('should throw error if article comment not found', async () =>
	{
		// Arrange
		const tempData = {
			...data,
			type: constants.userTicket.types.articleComment,
		};

		const apiData = await APITypes.parse.bind(mockAPIContext)(report.apiTypes, tempData);

		mockDbQuery.mockResolvedValueOnce([{ id: 84738 }]);
		mockDbQuery.mockResolvedValueOnce([]);

		// Act & Assert
		await expect(report.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('no-such-newsletter-article-comment'));
	});

	test('should report article comment', async () =>
	{
		// Arrange
		const tempData = {
			...data,
			type: constants.userTicket.types.articleComment,
		};

		const apiData = await APITypes.parse.bind(mockAPIContext)(report.apiTypes, tempData);

		mockDbQuery.mockResolvedValueOnce([{ id: 84738 }]); // typeId
		mockDbQuery.mockResolvedValueOnce([{ comment: 'Bad comment', user_id: constants.accUserId }]); // article comment
		mockDbQuery.mockResolvedValueOnce([]); // no existing ticket
		mockAPIContext.query.mockResolvedValueOnce(false); // processUserTickets
		mockAPIContext.query.mockResolvedValueOnce(false); // processModTickets
		mockAPIContext.query.mockResolvedValueOnce({ group: { identifier: constants.groupIdentifiers.user } }); // violator
		mockDbQuery.mockResolvedValueOnce([{ id: 48393 }]); // insert ticket
		mockDbQuery.mockResolvedValueOnce([]); // no existing violation
		mockDbQuery.mockResolvedValueOnce([]); // insert violation
		mockAPIContext.query.mockResolvedValueOnce(null); // notification

		// Act
		const result = await report.call(mockAPIContext, apiData);

		// Assert
		expect(result).toEqual({
			_successImage: constants.allImages['icons/icon_check.png'],
		});
	});

	test('should set referenceUrl for map type', async () =>
	{
		// Arrange
		const tempData = {
			...data,
			type: constants.userTicket.types.map,
		};

		const apiData = await APITypes.parse.bind(mockAPIContext)(report.apiTypes, tempData);

		mockDbQuery.mockResolvedValueOnce([{ id: 84738 }]); // typeId
		mockDbQuery.mockResolvedValueOnce([{ id: 1234, name: 'My Town', user_id: constants.accUserId, map_design_file_id: 'abc123.png' }]); // town
		mockDbQuery.mockResolvedValueOnce([]); // no existing ticket
		mockAPIContext.query.mockResolvedValueOnce(false); // processUserTickets
		mockAPIContext.query.mockResolvedValueOnce(false); // processModTickets
		mockAPIContext.query.mockResolvedValueOnce({ group: { identifier: constants.groupIdentifiers.user } }); // violator
		mockDbQuery.mockResolvedValueOnce([{ id: 48393 }]); // insert ticket
		mockDbQuery.mockResolvedValueOnce([]); // no existing violation
		mockDbQuery.mockResolvedValueOnce([]); // insert violation
		mockAPIContext.query.mockResolvedValueOnce(null); // notification

		// Act
		const result = await report.call(mockAPIContext, apiData);

		// Assert
		expect(result).toEqual({
			_successImage: constants.allImages['icons/icon_check.png'],
		});

		// Verify referenceUrl was set (the INSERT call should include the map URL)
		const insertCall = mockDbQuery.mock.calls.find(([sql]) =>
			sql.includes('INSERT INTO user_ticket'),
		);

		expect(insertCall).toBeTruthy();
		expect(insertCall![4]).toEqual(`${constants.USER_FILE_DIR}${constants.accUserId}/abc123.png`);
	});

	test('should fall back to accUserId when shop audit user_id is null', async () =>
	{
		// Arrange
		const tempData = {
			...data,
			type: constants.userTicket.types.shopName,
		};

		const apiData = await APITypes.parse.bind(mockAPIContext)(report.apiTypes, tempData);

		mockDbQuery.mockResolvedValueOnce([{ id: 84738 }]); // typeId
		mockDbQuery.mockResolvedValueOnce([{ name: 'My Shop', short_description: null, description: null, description_format: null, file_id: null, user_id: null, filename: null }]); // shop with null audit user
		mockDbQuery.mockResolvedValueOnce([]); // no existing ticket
		mockAPIContext.query.mockResolvedValueOnce(false); // processUserTickets
		mockAPIContext.query.mockResolvedValueOnce(false); // processModTickets
		mockAPIContext.query.mockResolvedValueOnce({ group: { identifier: constants.groupIdentifiers.user } }); // violator (accUserId)
		mockDbQuery.mockResolvedValueOnce([{ id: 48393 }]); // insert ticket
		mockDbQuery.mockResolvedValueOnce([]); // no existing violation
		mockDbQuery.mockResolvedValueOnce([]); // insert violation
		mockAPIContext.query.mockResolvedValueOnce(null); // notification

		// Act
		const result = await report.call(mockAPIContext, apiData);

		// Assert
		expect(result).toEqual({
			_successImage: constants.allImages['icons/icon_check.png'],
		});

		// Verify violatorId was set to accUserId
		const insertCall = mockDbQuery.mock.calls.find(([sql]) =>
			sql.includes('INSERT INTO user_ticket'),
		);

		expect(insertCall).toBeTruthy();
		expect(insertCall![7]).toEqual(constants.accUserId);
	});

	test('should set parentId for offer type', async () =>
	{
		// Arrange
		const tempData = {
			...data,
			type: constants.userTicket.types.offer,
		};

		const listingId = 7890;

		const apiData = await APITypes.parse.bind(mockAPIContext)(report.apiTypes, tempData);

		mockDbQuery.mockResolvedValueOnce([{ id: 84738 }]); // typeId
		mockDbQuery.mockResolvedValueOnce([{ comment: 'Bad offer', user_id: constants.accUserId, listing_id: listingId }]); // offer
		mockDbQuery.mockResolvedValueOnce([]); // no existing ticket
		mockAPIContext.query.mockResolvedValueOnce(false); // processUserTickets
		mockAPIContext.query.mockResolvedValueOnce(false); // processModTickets
		mockAPIContext.query.mockResolvedValueOnce({ group: { identifier: constants.groupIdentifiers.user } }); // violator
		mockDbQuery.mockResolvedValueOnce([{ id: 48393 }]); // insert ticket
		mockDbQuery.mockResolvedValueOnce([]); // no existing violation
		mockDbQuery.mockResolvedValueOnce([]); // insert violation
		mockAPIContext.query.mockResolvedValueOnce(null); // notification

		// Act
		const result = await report.call(mockAPIContext, apiData);

		// Assert
		expect(result).toEqual({
			_successImage: constants.allImages['icons/icon_check.png'],
		});

		const insertCall = mockDbQuery.mock.calls.find(([sql]) =>
			sql.includes('INSERT INTO user_ticket'),
		);

		expect(insertCall).toBeTruthy();
		expect(insertCall![9]).toEqual(listingId); // parentId
	});

	test('should set parentId for postImage type', async () =>
	{
		// Arrange
		const tempData = {
			...data,
			type: constants.userTicket.types.postImage,
		};

		const parentNodeId = 5678;

		const apiData = await APITypes.parse.bind(mockAPIContext)(report.apiTypes, tempData);

		mockDbQuery.mockResolvedValueOnce([{ id: 84738 }]); // typeId
		mockDbQuery.mockResolvedValueOnce([{ file_id: 'img123.png', caption: 'Bad image', reviser_id: constants.accUserId, parent_node_id: parentNodeId }]); // post image
		mockDbQuery.mockResolvedValueOnce([]); // no existing ticket
		mockAPIContext.query.mockResolvedValueOnce(false); // processUserTickets
		mockAPIContext.query.mockResolvedValueOnce(false); // processModTickets
		mockAPIContext.query.mockResolvedValueOnce({ group: { identifier: constants.groupIdentifiers.user } }); // violator
		mockDbQuery.mockResolvedValueOnce([{ id: 48393 }]); // insert ticket
		mockDbQuery.mockResolvedValueOnce([]); // no existing violation
		mockDbQuery.mockResolvedValueOnce([]); // insert violation
		mockAPIContext.query.mockResolvedValueOnce(null); // notification

		// Act
		const result = await report.call(mockAPIContext, apiData);

		// Assert
		expect(result).toEqual({
			_successImage: constants.allImages['icons/icon_check.png'],
		});

		const insertCall = mockDbQuery.mock.calls.find(([sql]) =>
			sql.includes('INSERT INTO user_ticket'),
		);

		expect(insertCall).toBeTruthy();
		expect(insertCall![9]).toEqual(parentNodeId); // parentId
	});

	test('should send modminUT notification for new unassigned ticket', async () =>
	{
		// Arrange
		const apiData = await APITypes.parse.bind(mockAPIContext)(report.apiTypes, data);

		mockDbQuery.mockResolvedValueOnce([{ id: 84738 }]); // typeId
		mockDbQuery.mockResolvedValueOnce([{ user_id: constants.accUserId, title: null, content: 'Random Content', content_format: 'markdown' }]); // post
		mockDbQuery.mockResolvedValueOnce([]); // no existing ticket
		mockAPIContext.query.mockResolvedValueOnce(false); // processUserTickets
		mockAPIContext.query.mockResolvedValueOnce(false); // processModTickets
		mockAPIContext.query.mockResolvedValueOnce({ group: { identifier: constants.groupIdentifiers.user } }); // violator
		mockDbQuery.mockResolvedValueOnce([{ id: 48393 }]); // insert ticket
		mockDbQuery.mockResolvedValueOnce([]); // no existing violation
		mockDbQuery.mockResolvedValueOnce([]); // insert violation
		mockAPIContext.query.mockResolvedValueOnce(null); // notification

		// Act
		await report.call(mockAPIContext, apiData);

		// Assert
		const notificationCall = mockAPIContext.query.mock.calls.find(([api, params]) =>
			api === 'v1/notification/create' && params.type === constants.notification.types.modminUT,
		);

		expect(notificationCall).toBeTruthy();
	});

	test('should send modminUTMany notification for existing ticket', async () =>
	{
		// Arrange
		const apiData = await APITypes.parse.bind(mockAPIContext)(report.apiTypes, data);

		mockDbQuery.mockResolvedValueOnce([{ id: 84738 }]); // typeId
		mockDbQuery.mockResolvedValueOnce([{ user_id: constants.accUserId, title: null, content: 'Random Content', content_format: 'markdown' }]); // post
		mockDbQuery.mockResolvedValueOnce([{ id: 48393 }]); // existing ticket
		mockDbQuery.mockResolvedValueOnce([]); // no existing violation
		mockDbQuery.mockResolvedValueOnce([]); // insert violation
		mockAPIContext.query.mockResolvedValueOnce(null); // notification

		// Act
		await report.call(mockAPIContext, apiData);

		// Assert
		const notificationCall = mockAPIContext.query.mock.calls.find(([api, params]) =>
			api === 'v1/notification/create' && params.type === constants.notification.types.modminUTMany,
		);

		expect(notificationCall).toBeTruthy();
	});

	test('should skip notification when ticket is self-assigned', async () =>
	{
		// Arrange
		const apiData = await APITypes.parse.bind(mockAPIContext)(report.apiTypes, data);

		mockDbQuery.mockResolvedValueOnce([{ id: 84738 }]); // typeId
		mockDbQuery.mockResolvedValueOnce([{ user_id: constants.accUserId, title: null, content: 'Random Content', content_format: 'markdown' }]); // post
		mockDbQuery.mockResolvedValueOnce([]); // no existing ticket
		mockAPIContext.query.mockResolvedValueOnce(true); // processUserTickets
		mockAPIContext.query.mockResolvedValueOnce(false); // processModTickets
		mockAPIContext.query.mockResolvedValueOnce({ group: { identifier: constants.groupIdentifiers.user } }); // violator
		mockDbQuery.mockResolvedValueOnce([{ id: 48393 }]); // insert ticket
		mockDbQuery.mockResolvedValueOnce([]); // no existing violation
		mockDbQuery.mockResolvedValueOnce([]); // insert violation

		// Act
		await report.call(mockAPIContext, apiData);

		// Assert — no notification/create call should have been made
		const notificationCall = mockAPIContext.query.mock.calls.find(([api]) =>
			api === 'v1/notification/create',
		);

		expect(notificationCall).toBeFalsy();
	});

	test('should set referenceFormat for shop description', async () =>
	{
		// Arrange
		const tempData = {
			...data,
			type: constants.userTicket.types.shopDescription,
		};

		const apiData = await APITypes.parse.bind(mockAPIContext)(report.apiTypes, tempData);

		mockDbQuery.mockResolvedValueOnce([{ id: 84738 }]); // typeId
		mockDbQuery.mockResolvedValueOnce([{ name: 'My Shop', short_description: 'Short', description: 'Full description', description_format: 'markdown', file_id: null, user_id: constants.accUserId, filename: null }]);
		mockDbQuery.mockResolvedValueOnce([]); // no existing ticket
		mockAPIContext.query.mockResolvedValueOnce(false);
		mockAPIContext.query.mockResolvedValueOnce(false);
		mockAPIContext.query.mockResolvedValueOnce({ group: { identifier: constants.groupIdentifiers.user } });
		mockDbQuery.mockResolvedValueOnce([{ id: 48393 }]); // insert ticket
		mockDbQuery.mockResolvedValueOnce([]); // no existing violation
		mockDbQuery.mockResolvedValueOnce([]); // insert violation
		mockAPIContext.query.mockResolvedValueOnce(null); // notification

		// Act
		const result = await report.call(mockAPIContext, apiData);

		// Assert
		expect(result).toEqual({
			_successImage: constants.allImages['icons/icon_check.png'],
		});

		const insertCall = mockDbQuery.mock.calls.find(([sql]) =>
			sql.includes('INSERT INTO user_ticket'),
		);

		expect(insertCall).toBeTruthy();
		expect(insertCall![3]).toEqual('Full description'); // referenceText
		expect(insertCall![8]).toEqual('markdown'); // referenceFormat
	});

	test('should set referenceFormat for shop application', async () =>
	{
		// Arrange
		const tempData = {
			...data,
			type: constants.userTicket.types.shopApplication,
		};

		const apiData = await APITypes.parse.bind(mockAPIContext)(report.apiTypes, tempData);

		mockDbQuery.mockResolvedValueOnce([{ id: 84738 }]); // typeId
		mockDbQuery.mockResolvedValueOnce([{ application: 'My application text', application_format: 'bbcode', user_id: constants.accUserId }]);
		mockDbQuery.mockResolvedValueOnce([]); // no existing ticket
		mockAPIContext.query.mockResolvedValueOnce(false);
		mockAPIContext.query.mockResolvedValueOnce(false);
		mockAPIContext.query.mockResolvedValueOnce({ group: { identifier: constants.groupIdentifiers.user } });
		mockDbQuery.mockResolvedValueOnce([{ id: 48393 }]); // insert ticket
		mockDbQuery.mockResolvedValueOnce([]); // no existing violation
		mockDbQuery.mockResolvedValueOnce([]); // insert violation
		mockAPIContext.query.mockResolvedValueOnce(null); // notification

		// Act
		const result = await report.call(mockAPIContext, apiData);

		// Assert
		expect(result).toEqual({
			_successImage: constants.allImages['icons/icon_check.png'],
		});

		const insertCall = mockDbQuery.mock.calls.find(([sql]) =>
			sql.includes('INSERT INTO user_ticket'),
		);

		expect(insertCall).toBeTruthy();
		expect(insertCall![3]).toEqual('My application text'); // referenceText
		expect(insertCall![8]).toEqual('bbcode'); // referenceFormat
	});
});
