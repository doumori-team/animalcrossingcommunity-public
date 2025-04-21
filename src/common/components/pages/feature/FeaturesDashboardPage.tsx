import { Link } from 'react-router';

import { RequireUser, RequirePermission } from '@behavior';
import { Form, Select, Check, Text } from '@form';
import { Pagination, Header, Section, Search, Grid } from '@layout';
import { constants, utils, routerUtils } from '@utils';
import { APIThisType, FeaturesType, FeatureCategoryType, FeatureStatusType } from '@types';

export const action = routerUtils.formAction;

const FeaturesDashboardPage = ({ loaderData }: { loaderData: FeaturesDashboardPageProps }) =>
{
	const { features, categories, statuses, page, pageSize, totalCount, categoryId,
		isBug, statusId, following, staffOnly, readOnly, assignedUser, createdUser } = loaderData;

	const link = `&categoryId=${encodeURIComponent(categoryId)}
		&isBug=${encodeURIComponent(isBug)}
		&statusId=${encodeURIComponent(statusId)}
		&following=${encodeURIComponent(following)}
		&staffOnly=${encodeURIComponent(staffOnly)}
		&readOnly=${encodeURIComponent(readOnly)}
		&assignedUser=${encodeURIComponent(assignedUser)}
		&createdUser=${encodeURIComponent(createdUser)}
	`;

	return (
		<div className='FeaturesDashboardPage'>
			<RequireUser>
				<Header
					name='Features'
					links={
						<Link to={`/features/add`}>
							Suggest Feature / Report Bug
						</Link>
					}
				/>

				<Search callback='/features'>
					<Form.Group>
						<Select
							label='Category'
							name='categoryId'
							value={categoryId}
							options={[
								{ id: 0, name: 'All Categories' },
							].concat(categories.concat([{ id: -1, name: 'Other' }]))}
							optionsMapping={{ value: 'id', label: 'name' }}
						/>
					</Form.Group>
					<Form.Group>
						<Check
							label='Type'
							options={[
								{ id: 'yes', name: 'Bug Report' },
								{ id: 'no', name: 'Feature Request' },
								{ id: 'both', name: 'Both' },
							]}
							name='isBug'
							defaultValue={utils.realStringLength(isBug) > 0 ?
								[isBug] : ['both']}
						/>
					</Form.Group>
					<Form.Group>
						<Select
							label='Status'
							name='statusId'
							value={statusId}
							options={[
								{ id: '', name: 'All Statuses' },
							].concat(statuses)}
							optionsMapping={{ value: 'id', label: 'name' }}
						/>
					</Form.Group>
					<Form.Group>
						<Check
							label='Following'
							options={constants.boolOptions}
							name='following'
							defaultValue={utils.realStringLength(following) > 0 ?
								[following] : ['both']}
						/>
					</Form.Group>
					<RequirePermission permission='advanced-features' silent>
						<Form.Group>
							<Text
								label='Assigned User'
								name='assignedUser'
								value={assignedUser}
								maxLength={constants.max.searchUsername}
							/>
						</Form.Group>
						<Form.Group>
							<Text
								label='Creator'
								name='createdUser'
								value={createdUser}
								maxLength={constants.max.searchUsername}
							/>
						</Form.Group>
						<Form.Group>
							<Check
								label='Staff Only'
								options={constants.boolOptions}
								name='staffOnly'
								defaultValue={utils.realStringLength(staffOnly) > 0 ?
									[staffOnly] : ['both']}
							/>
						</Form.Group>
						<Form.Group>
							<Check
								label='Read Only'
								options={constants.boolOptions}
								name='readOnly'
								defaultValue={utils.realStringLength(readOnly) > 0 ?
									[readOnly] : ['both']}
							/>
						</Form.Group>
					</RequirePermission>
				</Search>

				<Section>
					<Grid name='feature' options={features}>
						{features.map((feature, index) =>
							<div className='FeaturesDashboardPage_feature' key={index}>
								<div className='FeaturesDashboardPage_featureItem'>
									<Link to={`/feature/${feature.id}`}>
										{feature.title}<RequirePermission permission='advanced-features' silent><> (Staff Only: {feature.staffOnly ? 'Yes' : 'No'}) (Read Only: {feature.readOnly ? 'Yes' : 'No'})</></RequirePermission>
									</Link>
								</div>

								<div className='FeaturesDashboardPage_featureItem'>
									Created By: <Link to={`/profile/${feature.user.id}`}>
										{feature.user.username}
									</Link> ({feature.formattedCreated})
								</div>

								<div className='FeaturesDashboardPage_featureItem'>
									Category: {feature.category}
								</div>

								<div className='FeaturesDashboardPage_featureItem'>
									Status: {feature.status}
								</div>

								<div className='FeaturesDashboardPage_featureItem'>
									Type: {feature.isBug ? 'Bug Report' : 'Feature Request'}
								</div>
							</div>,
						)}
					</Grid>

					<Pagination
						page={page}
						pageSize={pageSize}
						totalCount={totalCount}
						startLink='features'
						endLink={link}
					/>
				</Section>
			</RequireUser>
		</div>
	);
};

async function loadData(this: APIThisType, _: any, { page, categoryId, isBug, statusId, following, staffOnly, readOnly, createdUser, assignedUser }: { page?: string, categoryId?: string, isBug?: string, statusId?: string, following?: string, staffOnly?: string, readOnly?: string, createdUser?: string, assignedUser?: string }): Promise<FeaturesDashboardPageProps>
{
	const [returnValue, categories, statuses] = await Promise.all([
		this.query('v1/features', {
			page: page ? page : 1,
			categoryId: categoryId ? categoryId : '',
			statusId: statusId ? statusId : '',
			isBug: isBug ? isBug : 'both',
			following: following ? following : 'both',
			staffOnly: staffOnly ? staffOnly : 'both',
			readOnly: readOnly ? readOnly : 'both',
			createdUser: createdUser ? createdUser : '',
			assignedUser: assignedUser ? assignedUser : '',
		}),
		this.query('v1/feature/categories'),
		this.query('v1/feature/statuses'),
	]);

	return {
		features: returnValue.results,
		totalCount: returnValue.count,
		page: returnValue.page,
		pageSize: returnValue.pageSize,
		categoryId: returnValue.categoryId,
		statusId: returnValue.statusId,
		isBug: returnValue.isBug,
		following: returnValue.following,
		staffOnly: returnValue.staffOnly,
		readOnly: returnValue.readOnly,
		createdUser: returnValue.createdUser,
		assignedUser: returnValue.assignedUser,
		categories: categories,
		statuses: statuses,
	};
}

export const loader = routerUtils.wrapLoader(loadData);

type FeaturesDashboardPageProps = {
	features: FeaturesType['results']
	totalCount: FeaturesType['count']
	page: FeaturesType['page']
	pageSize: FeaturesType['pageSize']
	categoryId: FeaturesType['categoryId']
	statusId: FeaturesType['statusId']
	isBug: FeaturesType['isBug']
	following: FeaturesType['following']
	staffOnly: FeaturesType['staffOnly']
	readOnly: FeaturesType['readOnly']
	createdUser: FeaturesType['createdUser']
	assignedUser: FeaturesType['assignedUser']
	categories: FeatureCategoryType[]
	statuses: FeatureStatusType[]
};

export default FeaturesDashboardPage;
