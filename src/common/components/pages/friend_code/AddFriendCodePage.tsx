import { RequireUser } from '@behavior';
import EditFriendCode from '@/components/friend_codes/EditFriendCode.tsx';
import { Section } from '@layout';
import { APIThisType, CharacterType, GamesType } from '@types';
import { routerUtils } from '@utils';

export const action = routerUtils.formAction;

const AddFriendCodePage = ({ loaderData }: { loaderData: AddFriendCodePageProps }) =>
{
	const { games, characters } = loaderData;

	return (
		<div className='AddFriendCodePage'>
			<RequireUser permission='use-friend-codes'>
				<Section>
					<EditFriendCode
						games={games}
						characters={characters}
					/>
				</Section>
			</RequireUser>
		</div>
	);
};

async function loadData(this: APIThisType): Promise<AddFriendCodePageProps>
{
	const [games, characters] = await Promise.all([
		this.query('v1/games'),
		this.query('v1/users/characters'),
	]);

	return { games, characters };
}

export const loader = routerUtils.wrapLoader(loadData);

type AddFriendCodePageProps = {
	games: GamesType[]
	characters: CharacterType[]
};

export default AddFriendCodePage;
