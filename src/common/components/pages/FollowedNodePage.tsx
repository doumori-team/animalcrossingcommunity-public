import { RequireUser } from '@behavior';
import Node from '@/components/nodes/Node.tsx';
import { Header, Grid, Pagination } from '@layout';
import { APIThisType, FollowedNodesType, BirthdaysType, EmojiSettingType } from '@types';
import { routerUtils } from '@utils';
import { UserContext } from '@contexts';

export const action = routerUtils.formAction;

const FollowedNodePage = ({ loaderData }: { loaderData: FollowedNodePageProps }) =>
{
	const { nodes, type, page, pageSize, totalCount, birthdays, nodeUsersEmojiSettings } = loaderData;

	return (
		<RequireUser>
			<div className='FollowedNodePage'>
				<Header name={`Followed ${type}s`} />
				<Grid
					options={nodes}
					message='Nothing is currently being followed.'
				>
					<UserContext.Consumer>
						{currentUser =>
							nodes.map(node =>
								<Node
									{...node}
									key={node.id}
									followNode={true}
									birthdays={birthdays}
									currentUser={currentUser}
									emojiSettings={'user' in node && node.user !== null ?
										nodeUsersEmojiSettings.filter(s => s.userId === node.user?.id) :
										[]}
									pageLink='forums'
								/>,
							)
						}
					</UserContext.Consumer>
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
	const [returnValue, birthdays] = await Promise.all([
		this.query('v1/node/followed', { type: type, page: page ? page : 1 }),
		this.query('v1/birthdays'),
	]);

	let nodeUsersEmojiSettings = [];

	if (type === 'post' && returnValue.results.length > 0)
	{
		[nodeUsersEmojiSettings] = await Promise.all([
			this.query('v1/settings/emoji', { userIds: returnValue.results.map((cn: FollowedNodesType['results'][number]) => cn.user?.id).filter((id?: number) => id) }),
		]);
	}

	return {
		type: returnValue.type,
		nodes: returnValue.results,
		page: returnValue.page,
		pageSize: returnValue.pageSize,
		totalCount: returnValue.totalCount,
		birthdays: birthdays,
		nodeUsersEmojiSettings: nodeUsersEmojiSettings,
	};
}

export const loader = routerUtils.wrapLoader(loadData);

type FollowedNodePageProps = {
	type: FollowedNodesType['type']
	nodes: FollowedNodesType['results']
	page: FollowedNodesType['page']
	pageSize: FollowedNodesType['pageSize']
	totalCount: FollowedNodesType['totalCount']
	birthdays: BirthdaysType[]
	nodeUsersEmojiSettings: EmojiSettingType[]
};

export default FollowedNodePage;
