import { RequireUser } from '@behavior';
import EditFriendCode from '@/components/friend_codes/EditFriendCode.tsx';
import { Section } from '@layout';
import { APIThisType, FriendCodeType, CharacterType } from '@types';
import { routerUtils } from '@utils';

export const action = routerUtils.formAction;

const EditFriendCodePage = ({ loaderData }: { loaderData: EditFriendCodePageProps }) =>
{
	const { friendCode, characters } = loaderData;

	return (
		<div className='EditFriendCodePage'>
			<RequireUser id={friendCode.userId} permission='use-friend-codes'>
				<Section>
					<EditFriendCode
						friendCode={friendCode}
						characters={characters}
					/>
				</Section>
			</RequireUser>
		</div>
	);
};

async function loadData(this: APIThisType, { friendCodeId }: { friendCodeId: string }): Promise<EditFriendCodePageProps>
{
	const [friendCode, characters] = await Promise.all([
		this.query('v1/friend_code', { id: friendCodeId }),
		this.query('v1/users/characters'),
	]);

	return { friendCode, characters };
}

export const loader = routerUtils.wrapLoader(loadData);

type EditFriendCodePageProps = {
	friendCode: FriendCodeType
	characters: CharacterType[]
};

export default EditFriendCodePage;
