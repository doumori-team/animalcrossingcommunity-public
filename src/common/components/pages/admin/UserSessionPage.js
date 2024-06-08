import React from 'react';
import { useLoaderData } from 'react-router-dom';

import { RequirePermission } from '@behavior';
import { Form, Text } from '@form';
import { Pagination, Header, Search, Section, Grid, InnerSection } from '@layout';
import { constants } from '@utils';

const UserSessionPage = () =>
{
	const {url, userSession, page, pageSize, totalCount} = useLoaderData();

	const link = `
		&url=${encodeURIComponent(url)}
	`;

	return (
		<div className='UserSessionPage'>
			<RequirePermission permission='process-user-tickets'>
				<Header name={`User Session #${userSession.id} for ${userSession.user.username}`} />

				<Search callback={`/user-session/${userSession.id}`}>
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
					<Grid name='user session' options={userSession.urls}>
						{userSession.urls.map((url, index) =>
							<InnerSection key={index}>
								<div className='UserSessionPage_urlDate'>
									Date: {url.formattedDate}
								</div>

								<div className='UserSessionPage_urlPage'>
									Page: {url.url}
								</div>

								{url.params && (
									<div className='UserSessionPage_urlParams'>
										Params: <pre>{url.params}</pre>
									</div>
								)}

								{url.query && (
									<div className='UserSessionPage_urlQuery'>
										Query: <pre>{url.query}</pre>
									</div>
								)}
							</InnerSection>
						)}
					</Grid>

					<Pagination
						page={page}
						pageSize={pageSize}
						totalCount={totalCount}
						startLink={`user-session/${userSession.id}`}
						endLink={link}
					/>
				</Section>
			</RequirePermission>
		</div>
	);
}

export async function loadData({id}, {page, url})
{
	const [returnValue] = await Promise.all([
		this.query('v1/session/session', {
			id: id,
			page: page ? page : 1,
			url: url ? url : '',
		}),
	]);

	return {
		userSession: returnValue.results,
		totalCount: returnValue.count,
		page: returnValue.page,
		pageSize: returnValue.pageSize,
		url: returnValue.url,
	};
}

export default UserSessionPage;