import { RequireUser } from '@behavior';
import Node from '@/components/nodes/Node.tsx';
import { utils, routerUtils } from '@utils';
import { Header, Grid, Pagination } from '@layout';
import { APIThisType, UserLiteType, UserThreadsType } from '@types';

export const action = routerUtils.formAction;

const ThreadsPage = ({ loaderData }: { loaderData: ThreadsPageProps }) =>
{
	const { user, threads, page, pageSize, totalCount } = loaderData;

	return (
		<RequireUser>
			<div className='ThreadsPage'>
				<Header
					name={`${utils.getPossessiveNoun(user.username)} Threads`}
					link={`/profile/${encodeURIComponent(user.id)}`}
				/>

				<Grid name='thread' options={threads}>
					{threads.map(node =>
						<Node {...node} key={node.id} followNode={true} />,
					)}
				</Grid>

				<Pagination
					page={page}
					pageSize={pageSize}
					totalCount={totalCount}
					startLink={`threads/${encodeURIComponent(user.id)}`}
				/>
			</div>
		</RequireUser>
	);
};

async function loadData(this: APIThisType, { userId }: { userId: string }, { page }: { page?: string }): Promise<ThreadsPageProps>
{
	const [returnValue, user] = await Promise.all([
		this.query('v1/users/threads', { id: userId, page: page ? page : 1 }),
		this.query('v1/user_lite', { id: userId }),
	]);

	return {
		user: user,
		threads: returnValue.results,
		page: returnValue.page,
		totalCount: returnValue.totalCount,
		pageSize: returnValue.pageSize,
	};
}

export const loader = routerUtils.wrapLoader(loadData);

type ThreadsPageProps = {
	user: UserLiteType
	threads: UserThreadsType['results']
	page: UserThreadsType['page']
	totalCount: UserThreadsType['totalCount']
	pageSize: UserThreadsType['pageSize']
};

export default ThreadsPage;
