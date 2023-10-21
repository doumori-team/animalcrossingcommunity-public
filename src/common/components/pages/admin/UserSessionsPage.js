import React from 'react';
import { Link, useLoaderData } from 'react-router-dom';

import { RequirePermission } from '@behavior';
import { Form, Text, Select } from '@form';
import { Pagination, Header, Search, Section, Grid, InnerSection } from '@layout';
import { constants, dateUtils } from '@utils';

const UserSessionsPage = () =>
{
	const {username, startDate, endDate, urlId, urls, sessions, page, pageSize,
		totalCount} = useLoaderData();

	const link = `&username=${encodeURIComponent(username)}
		&startDate=${encodeURIComponent(startDate)}
		&endDate=${encodeURIComponent(endDate)}
		&urlId=${encodeURIComponent(urlId)}
	`;

	const sessionLink = urlId > 0 ?
		`?urlId=${encodeURIComponent(urlId)}` : '';

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
						<Select
							label='URL'
							name='urlId'
							value={urlId}
							options={[{id: '', url: 'All URLs'}].concat(urls)}
							optionsMapping={{value: 'id', label: 'url'}}
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

								{userSession.formattedEndDate && (
									<div className='UserSessionPage_userSessionEndDate'>
										End Date: {userSession.formattedEndDate}
									</div>
								)}
							</InnerSection>
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
}

export async function loadData(_, {page, username, startDate, endDate, urlId})
{
	const [returnValue, urls] = await Promise.all([
		this.query('v1/session/sessions', {
			page: page ? page : 1,
			username: username ? username : '',
			startDate: startDate ? startDate : '',
			endDate: endDate ? endDate : '',
			urlId: urlId ? urlId : '',
		}),
		this.query('v1/session/urls'),
	]);

	return {
		sessions: returnValue.results,
		totalCount: returnValue.count,
		page: returnValue.page,
		pageSize: returnValue.pageSize,
		username: returnValue.username,
		startDate: returnValue.startDate,
		endDate: returnValue.endDate,
		urlId: returnValue.urlId,
		urls: urls,
	};
}

export default UserSessionsPage;