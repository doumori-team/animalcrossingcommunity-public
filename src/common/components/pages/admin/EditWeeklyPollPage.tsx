import { RequirePermission } from '@behavior';
import { Header } from '@layout';
import EditPoll from '@/components/admin/EditPoll.tsx';
import { APIThisType, PollType } from '@types';
import { routerUtils } from '@utils';

export const action = routerUtils.formAction;

const EditWeeklyPollPage = ({ loaderData }: { loaderData: EditWeeklyPollPageProps }) =>
{
	const { poll } = loaderData;

	return (
		<div className='EditWeeklyPollPage'>
			<RequirePermission permission='polls-admin'>
				<Header
					name='Weekly Polls'
					link='/admin/weekly-polls'
				/>

				<EditPoll
					{...poll}
				/>
			</RequirePermission>
		</div>
	);
};

async function loadData(this: APIThisType, { id }: { id: string }): Promise<EditWeeklyPollPageProps>
{
	const [poll] = await Promise.all([
		this.query('v1/poll', { id }),
	]);

	return { poll };
}

export const loader = routerUtils.wrapLoader(loadData);

type EditWeeklyPollPageProps = {
	poll: PollType
};

export default EditWeeklyPollPage;
