import { RequireUser } from '@behavior';
import Node from '@/components/nodes/Node.tsx';
import { Header, Grid, Pagination } from '@layout';
import { APIThisType, FollowedNodesType } from '@types';
import { routerUtils } from '@utils';

export const action = routerUtils.formAction;

const FollowedNodePage = ({ loaderData }: { loaderData: FollowedNodePageProps }) =>
{
	const { nodes, type, page, pageSize, totalCount } = loaderData;

	return (
		<RequireUser>
			<div className='FollowedNodePage'>
				<Header name={`Followed ${type}s`} />
				<Grid
					options={nodes}
					message='Nothing is currently being followed.'
				>
					{nodes.map(node =>
						<Node {...node} key={node.id} followNode={true} />,
					)}
				</Grid>

				<Pagination
					page={page}
					pageSize={pageSize}
					totalCount={totalCount}
					startLink={`followed/${encodeURIComponent(type)}`}
				/>
			</div>
		</RequireUser>
	);
};

async function loadData(this: APIThisType, { type }: { type: string }, { page }: { page?: string }): Promise<FollowedNodePageProps>
{
	const [returnValue] = await Promise.all([
		this.query('v1/node/followed', { type: type, page: page ? page : 1 }),
	]);

	return {
		type: returnValue.type,
		nodes: returnValue.results,
		page: returnValue.page,
		pageSize: returnValue.pageSize,
		totalCount: returnValue.totalCount,
	};
}

export const loader = routerUtils.wrapLoader(loadData);

type FollowedNodePageProps = {
	type: FollowedNodesType['type']
	nodes: FollowedNodesType['results']
	page: FollowedNodesType['page']
	pageSize: FollowedNodesType['pageSize']
	totalCount: FollowedNodesType['totalCount']
};

export default FollowedNodePage;
