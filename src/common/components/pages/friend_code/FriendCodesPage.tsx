import React from 'react';
import { Link, useLoaderData, Form as ReactRouterForm } from 'react-router-dom';

import { RequireUser, RequireClientJS } from '@behavior';
import { utils, constants } from '@utils';
import { Form, Select, Text, Button, Check } from '@form';
import FriendCode from '@/components/friend_codes/FriendCode.tsx';
import { Pagination, Header, Section } from '@layout';
import { UserContext } from '@contexts';
import * as iso from 'common/iso.js';
import { APIThisType, WhitelistFriendCodesType, WhitelistUserType } from '@types';

const FriendCodesPage = () =>
{
	const { friendCodes, sortBy, groupBy, games, requestUser, gameId,
		page, pageSize, totalCount } = useLoaderData() as FriendCodesPageProps;

	let groupByLink = '', sortByLink = '', link = '';

	if (utils.realStringLength(sortBy) > 0)
	{
		sortByLink = '&sort=' + encodeURIComponent(sortBy);
	}

	if (utils.realStringLength(groupBy) > 0)
	{
		groupByLink = '&group=' + encodeURIComponent(groupBy);
	}

	link = `${sortByLink}${groupByLink}`;

	if (gameId && Number(gameId) > 0)
	{
		link += `&gameId=${gameId}`;
	}

	const selectedGameId = Number(gameId || 0);

	const handleUserLookup = async (query: string) =>
	{
		let params = new FormData();
		params.append('query', query);

		return (iso as any).query(null, 'v1/friend_code/whitelist/users', params)
			.then(async (users: WhitelistUserType[]) =>
			{
				return users;
			})
			.catch((error: any) =>
			{
				console.error('Error attempting to get users.');
				console.error(error);

				return [];
			});
	};

	return (
		<div className='FriendCodesPage'>
			<RequireUser permission='use-friend-codes'>
				<Header
					name='Friend Codes'
					description={<div>What does Whitelisting mean? If you and another user whitelist each other by clicking the <img src={`${constants.AWS_URL}/images/icons/wifi.png`} alt='Whitelist User' /> next to their username on either a post or their profile, you will both be able to view the friend codes you've uploaded to ACC. If only one member whitelists someone the whitelisted user will only temporarily see your friend codes by clicking "Show Friend Codes" in the user's profile.</div>}
					links={
						<UserContext.Consumer>
							{currentUser => currentUser &&
								<Link to={`/profile/${encodeURIComponent(currentUser.id)}/friend-codes`}>
									My Friend Codes
								</Link>
							}
						</UserContext.Consumer>
					}
				/>

				<Section>
					<h3>Update User Access:</h3>
					<Form
						action='v1/friend_code/whitelist/save'
						className='FriendCodesPage_addUser'
						showButton
					>
						<div className='FriendCodesPage_addUserOptions'>
							<Form.Group>
								<Text
									name='whiteListUser'
									label='User'
									value={requestUser}
									required
									maxLength={constants.max.searchUsername}
								/>
							</Form.Group>

							<Form.Group>
								<Check
									options={constants.addRemoveOptions}
									name='action'
									defaultValue={['add']}
									label='Action'
								/>
							</Form.Group>
						</div>
					</Form>

					<div className='FriendCodesPage_users'>
						<Form.Group>
							<Select
								label='List of Whitelisted Users'
								placeholder='List of whitelisted users'
								optionsMapping={{ value: 'id', label: 'username' }}
								async
								loadOptionsHandler={handleUserLookup}
							/>
						</Form.Group>
					</div>
				</Section>

				<Section>
					<div className='FriendCodesPage_by'>
						<div className='FriendCodesPage_sort'>
							<h3>Sort by:</h3>
							<Link
								className={sortBy === 'username' ? 'FriendCodesPage_sortLink selected' : 'FriendCodesPage_sortLink'}
								to={`/friend-codes?sort=username${groupByLink}`}
							>
								Username
							</Link>
							{' | '}
							<Link
								className={sortBy === 'date' ? 'FriendCodesPage_sortLink selected' : 'FriendCodesPage_sortLink'}
								to={`/friend-codes?sort=date${groupByLink}`}
							>
								Whitelisted Date
							</Link>
						</div>

						<div className='FriendCodesPage_group'>
							<h3>Group by:</h3>
							<Link
								className={groupBy === 'all' ? 'FriendCodesPage_groupLink selected' : 'FriendCodesPage_groupLink'}
								to={`/friend-codes?group=all${sortByLink}`}
							>
								All
							</Link>
							{' | '}
							<Link
								className={groupBy === 'game' ? 'FriendCodesPage_groupLink selected' : 'FriendCodesPage_groupLink'}
								to={`/friend-codes?group=game${sortByLink}`}
							>
								Game
							</Link>
						</div>
					</div>

					<div className='FriendCodesPage_codes'>
						{groupBy === 'game' && games.length > 0 &&
							<ReactRouterForm
								action='/friend-codes'
								method='get'
								className='FriendCodesPage_game'
								reloadDocument
							>
								<input type='hidden' name='sort' value={sortBy} />
								<input type='hidden' name='group' value={groupBy} />

								<Form.Group>
									<Select
										label='Game'
										name='gameId'
										options={games}
										optionsMapping={{ value: 'id', label: 'name' }}
										groupBy='consoleName'
										placeholder='Select game...'
										value={gameId}
										changeHandler={(e: any) => e.target.form.submit()}
									/>
								</Form.Group>

								<RequireClientJS
									fallback={
										<Button
											type='submit'
											label='Go'
											className='FriendCodesPage_button'
										/>
									}
								/>
							</ReactRouterForm>
						}

						{friendCodes.length > 0 &&
							(groupBy === 'game' && selectedGameId > 0) ||
							groupBy === 'all' ?

							<div className='Grid'>
								{friendCodes.map(fc =>
									<div key={fc.id} className={groupBy === 'game' ? 'FriendCodesPage_gridGame' : ''}>
										<FriendCode
											friendCode={fc}
										/>
										User: <Link to={`/profile/${encodeURIComponent(fc.userId)}/friend-codes`}>
											{fc.username}
										</Link>
									</div>,
								)}
							</div>
							:
							'No friend codes available.'
						}
					</div>

					<Pagination
						page={page}
						pageSize={pageSize}
						totalCount={totalCount}
						startLink={`friend-codes`}
						endLink={link}
					/>
				</Section>
			</RequireUser>
		</div>
	);
};

export async function loadData(this: APIThisType, _: any, { sort, group, requestUser, gameId, page }: { sort?: string, group?: string, requestUser?: string, gameId?: string, page?: string }): Promise<FriendCodesPageProps>
{
	let sortBy = sort ? sort : 'username';
	let groupBy = group ? group : 'game';
	requestUser = requestUser ? requestUser : '';
	gameId = gameId ? gameId : '';

	const [fcObj] = await Promise.all([
		this.query('v1/friend_code/whitelist/friend_codes', { sortBy: sortBy, page: page ? page : 1, gameId: gameId, groupBy: groupBy }),
	]);

	return {
		sortBy,
		groupBy,
		games: fcObj.games,
		requestUser,
		gameId,
		friendCodes: fcObj.results,
		totalCount: groupBy === 'game' && gameId.length === 0 ? 0 : fcObj.count,
		page: fcObj.page,
		pageSize: fcObj.pageSize,
	};
}

type FriendCodesPageProps = {
	sortBy: string
	groupBy: string
	games: WhitelistFriendCodesType['games']
	requestUser: string
	gameId: string
	friendCodes: WhitelistFriendCodesType['results']
	totalCount: number | WhitelistFriendCodesType['count']
	page: WhitelistFriendCodesType['page']
	pageSize: WhitelistFriendCodesType['pageSize']
};

export default FriendCodesPage;
