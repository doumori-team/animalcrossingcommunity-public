import { Select } from '@form';
import { iso } from 'common/iso.ts';
import { UsersType, ChangeHandlerSelectType, ChangeHandleValueType } from '@types';

const UserLookup = ({
	label,
	changeHandler,
	options,
	value,
}: UserLookupProps) =>
{
	const handleUserLookup = async (query: string): Promise<UsersType[]> =>
	{
		return (await iso).query(null, 'v1/users', { query })
			.then(async (users: UsersType[]) =>
			{
				return users;
			})
			.catch((_: unknown) =>
			{
				return [];
			});
	};

	return (
		<Select
			name='users'
			label={label}
			options={options}
			optionsMapping={{ value: 'id', label: 'username' }}
			async
			value={value}
			changeHandler={changeHandler}
			loadOptionsHandler={handleUserLookup}
		/>
	);
};

type UserLookupProps = {
	label: string
	changeHandler: ChangeHandlerSelectType | ChangeHandleValueType
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	options?: any
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	value: string | number | any[] | null
};

export default UserLookup;
