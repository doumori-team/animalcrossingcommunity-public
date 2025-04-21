import { RequirePermission } from '@behavior';
import { Form, Text } from '@form';
import { Pagination, Header, Search, Section, Grid, InnerSection } from '@layout';
import { constants, routerUtils } from '@utils';
import { APIThisType, SessionType } from '@types';

export const action = routerUtils.formAction;

const UserSessionPage = ({ loaderData }: { loaderData: UserSessionPageProps }) =>
{
	const { url, userSession, page, pageSize, totalCount } = loaderData;

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

								{url.params &&
									<div className='UserSessionPage_urlParams'>
										Params: <pre>{url.params}</pre>
									</div>
								}

								{url.query &&
									<div className='UserSessionPage_urlQuery'>
										Query: <pre>{url.query}</pre>
									</div>
								}
							</InnerSection>,
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
};

async function loadData(this: APIThisType, { id }: { id: string }, { page, url }: { page?: string, url?: string }): Promise<UserSessionPageProps>
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

export const loader = routerUtils.wrapLoader(loadData);

type UserSessionPageProps = {
	userSession: SessionType['results']
	totalCount: SessionType['count']
	page: SessionType['page']
	pageSize: SessionType['pageSize']
	url: SessionType['url']
};

export default UserSessionPage;
