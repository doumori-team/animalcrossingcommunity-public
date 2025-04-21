import { Select } from '@form';
import { iso } from 'common/iso.ts';
import { ACGameItemType } from '@types';

const ItemLookup = ({
	label,
	options,
	value,
	selectedGameId,
}: ItemLookupProps) =>
{
	const handleItemsLookup = async (query: string): Promise<ACGameItemType[number]['all']['items']> =>
	{
		let callback = 'v1/acgame/catalog';

		let params: any = {
			query,
			categoryName: 'all',
			sortBy: 'items',
		};

		if (selectedGameId === 0)
		{
			callback = 'v1/catalog';
		}
		else
		{
			params.id = String(selectedGameId);
		}

		return (await iso).query(null, callback, params)
			.then(async (items: ACGameItemType[number]['all']['items']) =>
			{
				if (selectedGameId === 0)
				{
					return items;
				}

				return items.filter(item => item.tradeable);
			})
			.catch((_: any) =>
			{
				return [];
			});
	};

	return (
		<Select
			name='items'
			label={label}
			options={options}
			optionsMapping={{ value: 'id', label: 'name' }}
			value={value}
			placeholder='Select item(s)...'
			async
			multiple
			groupBy='categoryName'
			size={15}
			loadOptionsHandler={handleItemsLookup}
			key={selectedGameId}
		/>
	);
};

type ItemLookupProps = {
	label: string
	options?: any
	value: string | number | any[] | null
	selectedGameId: number
};

export default ItemLookup;
