import { Link } from 'react-router';

import { RequireUser } from '@behavior';
import { Pagination, Header, Section, Grid } from '@layout';
import Avatar from '@/components/nodes/Avatar.tsx';
import { Confirm } from '@form';
import { APIThisType, UserAvatarsType } from '@types';
import { routerUtils } from '@utils';

export const action = routerUtils.formAction;

const AvatarPage = ({ loaderData }: { loaderData: AvatarPageProps }) =>
{
	const { totalCount, avatars, page, pageSize } = loaderData;

	return (
		<div className='AvatarPage'>
			<RequireUser>
				<Header
					name='Saved Avatars'
					links={
						<Link to='/settings/avatar'>
							Avatar Settings
						</Link>
					}
				/>

				<Section>
					<Grid name='avatar' options={avatars}>
						{avatars.map((avatar, index) =>
							<div key={index} className='AvatarPage_avatar'>
								<div className='AvatarPage_links'>
									<Confirm
										action='v1/avatar/destroy'
										callback='/avatars'
										id={avatar.id}
										label='Delete'
										message='Are you sure you want to delete this avatar?'
									/>
									<Confirm
										action='v1/avatar/use'
										id={avatar.id}
										label='Use'
										message='Are you sure you want to use this avatar?'
									/>
								</div>
								<Avatar
									character={avatar.character}
									accent={avatar.accent}
									accentPosition={avatar.accentPosition}
									background={avatar.background}
									coloration={avatar.coloration}
								/>
							</div>,
						)}
					</Grid>

					<Pagination
						page={page}
						pageSize={pageSize}
						totalCount={totalCount}
						startLink={`avatars`}
					/>
				</Section>
			</RequireUser>
		</div>
	);
};

async function loadData(this: APIThisType, _: any, { page }: { page?: string }): Promise<AvatarPageProps>
{
	const [result] = await Promise.all([
		this.query('v1/users/avatars', {
			page: page ? page : 1,
		}),
	]);

	return {
		avatars: result.results,
		totalCount: result.count,
		page: result.page,
		pageSize: result.pageSize,
	};
}

export const loader = routerUtils.wrapLoader(loadData);

type AvatarPageProps = {
	avatars: UserAvatarsType['results']
	totalCount: UserAvatarsType['count']
	page: UserAvatarsType['page']
	pageSize: UserAvatarsType['pageSize']
};

export default AvatarPage;
