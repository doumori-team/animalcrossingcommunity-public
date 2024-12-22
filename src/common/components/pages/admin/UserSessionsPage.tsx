import React from 'react';
import { Link, useLoaderData } from 'react-router-dom';

import { RequirePermission } from '@behavior';
import { Form, Text } from '@form';
import { Pagination, Header, Search, Section, Grid, InnerSection } from '@layout';
import { constants, dateUtils, utils } from '@utils';
import { APIThisType, SessionsType } from '@types';

const UserSessionsPage = () =>
{
	const { username, startDate, endDate, url, sessions, page, pageSize,
		totalCount } = useLoaderData() as UserSessionsPageProps;

	const link = `&username=${encodeURIComponent(username)}
		&startDate=${encodeURIComponent(startDate)}
		&endDate=${encodeURIComponent(endDate)}
		&url=${encodeURIComponent(url)}
	`;

	const sessionLink = utils.realStringLength(url) > 0 ?
		`?url=${encodeURIComponent(url)}` : '';

	return (
		<div className='UserSessionsPage'>
			<RequirePermission permission='process-user-tickets'>
				<Header name='User Sessions' />

				<Search callback='/user-sessions'>
					<Form.Group>
						<Text
							label='User'
							name='username'
							value={username}
							maxLength={constants.max.searchUsername}
							required
						/>
					</Form.Group>
					<Form.Group>
						<Text
							type='date'
							name='startDate'
							label='Start Date'
							value={startDate}
							min='2002-10-28'
						/>
					</Form.Group>
					<Form.Group>
						<Text
							type='date'
							name='endDate'
							label='End Date'
							value={endDate}
							max={dateUtils.formatCurrentDateYearMonthDay()}
						/>
					</Form.Group>
					<Form.Group>
						<Text
							label='URL'
							name='url'
							value={url}
							maxLength={constants.max.url}
						/>
					</Form.Group>
				</Search>

				<Section>
					<Grid name='user session' options={sessions}>
						{sessions.map((userSession, index) =>
							<InnerSection key={index}>
								<div className='UserSessionPage_userSessionId'>
									ID: <Link to={`/user-session/${encodeURIComponent(userSession.id)}${sessionLink}`}>
										{userSession.id}
									</Link>
								</div>

								<div className='UserSessionPage_userSessionStartDate'>
									Start Date: {userSession.formattedStartDate}
								</div>

								{userSession.formattedEndDate &&
									<div className='UserSessionPage_userSessionEndDate'>
										End Date: {userSession.formattedEndDate}
									</div>
								}
							</InnerSection>,
						)}
					</Grid>

					<Pagination
						page={page}
						pageSize={pageSize}
						totalCount={totalCount}
						startLink={`user-sessions`}
						endLink={link}
					/>
				</Section>
			</RequirePermission>
		</div>
	);
};

export async function loadData(this: APIThisType, _: any, { page, username, startDate, endDate, url }: { page?: string, username?: string, startDate?: string, endDate?: string, url?: string }): Promise<UserSessionsPageProps>
{
	const [returnValue] = await Promise.all([
		this.query('v1/session/sessions', {
			page: page ? page : 1,
			username: username ? username : '',
			startDate: startDate ? startDate : '',
			endDate: endDate ? endDate : '',
			url: url ? url : '',
		}),
	]);

	return {
		sessions: returnValue.results,
		totalCount: returnValue.count,
		page: returnValue.page,
		pageSize: returnValue.pageSize,
		username: returnValue.username,
		startDate: returnValue.startDate,
		endDate: returnValue.endDate,
		url: returnValue.url,
	};
}

type UserSessionsPageProps = {
	sessions: SessionsType['results']
	totalCount: SessionsType['count']
	page: SessionsType['page']
	pageSize: SessionsType['pageSize']
	username: SessionsType['username']
	startDate: SessionsType['startDate']
	endDate: SessionsType['endDate']
	url: SessionsType['url']
};

export default UserSessionsPage;
