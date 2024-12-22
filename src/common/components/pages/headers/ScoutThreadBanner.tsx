import React from 'react';
import { Link, useLoaderData, Outlet } from 'react-router-dom';

import { RequireGroup, RequirePermission } from '@behavior';
import { constants } from '@utils';
import { Form, Check, TextArea } from '@form';
import { UserContext } from '@contexts';
import { Header, Section } from '@layout';
import { APIThisType, NodeLiteType, RatingsGivenType } from '@types';

const ScoutThreadBanner = () =>
{
	const { node, rating } = useLoaderData() as ScoutThreadBannerProps;

	const showRatings = Object.keys(constants.rating.configs)
		.map(x =>
		{
			return {
				id: (constants.rating.configs as any)[x].id,
				filename: (constants.rating.configs as any)[x].image,
			};
		});

	return (
		<>
			<div className='ScoutThreadBanner'>
				<Header
					name='Scout Hub'
					links={
						<>
							<RequirePermission permission='scout-pages' silent>
								<Link to={`/scout-hub`}>Scout Hub</Link>
								<Link to={`/scout-hub/new-members`}>New Members</Link>
							</RequirePermission>
							<RequireGroup group={constants.staffIdentifiers.scout} silent>
								<Link to={`/scout-hub/settings`}>Settings</Link>
								<UserContext.Consumer>
									{scout => scout &&
										<Link to={`/scout-hub/ratings/${encodeURIComponent(scout.id)}`}>
											Feedback
										</Link>
									}
								</UserContext.Consumer>
							</RequireGroup>
							<Link to={`/scout-hub/adoption/${encodeURIComponent(constants.boardIds.adopteeBT)}`}>
								Adoptee BT
							</Link>
							<RequirePermission permission='adoption-bt-settings' silent>
								<Link to={`/scout-hub/adoption/settings`}>
									Adoptee BT Settings
								</Link>
							</RequirePermission>
						</>
					}
				/>

				{node.locked && node.parentId === constants.boardIds.adopteeThread &&
					<RequireGroup group='user' silent>
						<Section>
							<h2>Feedback</h2>
							<Form
								action='v1/rating/save'
								className='ScoutThreadBanner_rating'
								showButton
							>
								<input type='hidden' name='adoptionNodeId' value={node.id} />
								<input type='hidden' name='id' value={rating ? rating.id : 0} />

								<Form.Group>
									<Check
										options={showRatings}
										name='rating'
										defaultValue={rating ? [rating.rating] : []}
										required={true}
										imageLocation='rating'
										useImageFilename={true}
										label='Rating'
									/>
								</Form.Group>
								<Form.Group>
									<TextArea
										name='comment'
										label='Comment'
										required
										value={rating ? rating.comment : ''}
										maxLength={constants.max.comment}
									/>
								</Form.Group>
							</Form>
						</Section>
					</RequireGroup>
				}
			</div>
			<Outlet />
		</>
	);
};

export async function loadData(this: APIThisType, { id }: { id: string }): Promise<ScoutThreadBannerProps>
{
	const [node, ratings] = await Promise.all([
		this.query('v1/node/lite', { id: id }),
		this.query('v1/users/ratings_given', { page: 1, type: constants.rating.types.scout }),
	]);

	return {
		node,
		rating: ratings.results.length > 0 ? ratings.results.pop() : null,
	};
}

type ScoutThreadBannerProps = {
	node: NodeLiteType
	rating: RatingsGivenType['results'][number] | null
};

export default ScoutThreadBanner;
