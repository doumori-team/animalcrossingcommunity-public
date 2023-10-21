import React from 'react';
import { useLoaderData } from 'react-router-dom';

import { RequirePermission } from '@behavior';
import { Form, Select } from '@form';
import { Pagination, Header, Search, Section, Grid, InnerSection } from '@layout';

const UserSessionPage = () =>
{
	const {urlId, urls, userSession, page, pageSize, totalCount} = useLoaderData();

	const link = `
		&urlId=${encodeURIComponent(urlId)}
	`;

	return (
		<div className='UserSessionPage'>
			<RequirePermission permission='process-user-tickets'>
				<Header name={`User Session #${userSession.id} for ${userSession.user.username}`} />

				<Search callback={`/user-session/${userSession.id}`}>
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

export async function loadData({id}, {page, urlId})
{
	const [returnValue, urls] = await Promise.all([
		this.query('v1/session/session', {
			id: id,
			page: page ? page : 1,
			urlId: urlId ? urlId : '',
		}),
		this.query('v1/session/urls'),
	]);

	return {
		userSession: returnValue.results,
		totalCount: returnValue.count,
		page: returnValue.page,
		pageSize: returnValue.pageSize,
		urlId: returnValue.urlId,
		urls: urls,
	};
}

export default UserSessionPage;