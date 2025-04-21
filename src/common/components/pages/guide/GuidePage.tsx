import { Link } from 'react-router';

import { RequirePermission } from '@behavior';
import { Confirm } from '@form';
import { ContentBox, Header, Section, Markup } from '@layout';
import { APIThisType, GuideType } from '@types';
import { routerUtils } from '@utils';

export const action = routerUtils.formAction;

const GuidePage = ({ loaderData }: { loaderData: GuidePageProps }) =>
{
	const { guide } = loaderData;

	const encodedId = encodeURIComponent(guide.id);
	const encodedGameId = encodeURIComponent(guide.game.id);

	return (
		<div className='GuidePage'>
			<RequirePermission permission='view-guides'>
				<Header
					name={
						<>
							{guide.updatedName ? guide.updatedName : guide.name}
							{' '}
							<small className='GuidePage_gameName'><cite>
								<Link to={`/guides/${encodedGameId}`}>
									{guide.game.shortname}
								</Link>
							</cite></small>
						</>
					}
					links={
						<RequirePermission permission='modify-guides' silent>
							<Link to={`/guide/${encodedId}/edit`}>
								Edit
							</Link>

							<RequirePermission permission='publish-guides' silent>
								<Confirm
									action='v1/guide/publish'
									callback={`/guide/${encodedId}`}
									id={guide.id}
									label='Publish'
									message='Are you sure you want to publish this guide?'
								/>

								<Confirm
									action='v1/guide/destroy'
									callback={`/guides/${encodedGameId}`}
									id={guide.id}
									label='Delete'
									message='Are you sure you want to delete this guide?'
								/>
							</RequirePermission>
						</RequirePermission>
					}
				/>

				<RequirePermission permission='modify-guides' silent>
					<Section>
						<div className='GuidePage_lastUpdated'>
							Last Updated: {guide.formattedLastUpdated}
						</div>

						<div className='GuidePage_updatedBy'>
							Updated By: {guide.user?.username}
						</div>

						<div className='GuidePage_published'>
							Last Published: {guide.formattedLastPublished}
						</div>

						<div className='GuidePage_hasChanges'>
							Has Unpublished Changes: {guide.hasChanges ? 'Yes' : 'No'}
						</div>
					</Section>
				</RequirePermission>

				<ContentBox>
					<Markup
						text={guide.updatedContent ? guide.updatedContent : guide.content}
						format={'markdown+html'}
					/>
				</ContentBox>
			</RequirePermission>
		</div>
	);
};

async function loadData(this: APIThisType, { id }: { id: string }): Promise<GuidePageProps>
{
	const [guide] = await Promise.all([
		this.query('v1/guide', { id: id }),
	]);

	return { guide };
}

export const loader = routerUtils.wrapLoader(loadData);

type GuidePageProps = {
	guide: GuideType
};

export default GuidePage;
