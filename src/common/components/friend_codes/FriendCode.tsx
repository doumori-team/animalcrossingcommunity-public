import { Link } from 'react-router';

import { RequireUser } from '@behavior';
import { Confirm } from '@form';
import { Keyboard } from '@layout';
import { FriendCodeType } from '@types';

const FriendCode = ({
	friendCode,
}: FriendCodeProps) =>
{
	const encodedUserId = encodeURIComponent(friendCode.userId);

	return (
		<div className='FriendCode'>
			<RequireUser id={friendCode.userId} silent>
				<div className='FriendCode_links'>
					<Link to={`/profile/${encodedUserId}/friend-code/${encodeURIComponent(friendCode.id)}/edit`}>
						Edit
					</Link>
					<Confirm
						action='v1/friend_code/destroy'
						callback={`/profile/${encodedUserId}/friend-codes`}
						id={friendCode.id}
						label='Delete'
						message='Are you sure you want to delete this friend code?'
						formId={`friend-code-destroy-${friendCode.id}`}
					/>
				</div>
			</RequireUser>

			<h3 className='FriendCode_name'>
				{friendCode.name}
			</h3>

			<div className='FriendCode_code'>
				{friendCode.code}
			</div>

			{friendCode.character &&
				<div className='FriendCode_character'>
					<Link to={`/profile/${encodedUserId}/towns`}>
						<Keyboard
							name={friendCode.character.name}
							gameId={friendCode.game.id}
						/>
					</Link> (<Keyboard
						name={friendCode.character.town.name}
						gameId={friendCode.game.id}
					/>)
				</div>
			}
		</div>
	);
};

type FriendCodeProps = {
	friendCode: FriendCodeType
};

export default FriendCode;
