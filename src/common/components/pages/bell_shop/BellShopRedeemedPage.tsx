import React from 'react';
import { useLoaderData } from 'react-router-dom';

import { RequireUser } from '@behavior';
import { Header, Section, Grid, Markup } from '@layout';
import Avatar from '@/components/nodes/Avatar.tsx';
import { APIThisType, UserBellShopItemType } from '@types';

const BellShopRedeemedPage = () =>
{
	const {items} = useLoaderData() as BellShopRedeemedPageProps;

	return (
		<div className='BellShopRedeemedPage'>
			<RequireUser>
				<Header name='My Redeemed Items' />

				<Section>
					<Grid message='No items redeemed.' options={items}>
						{items.map(item =>
							<div className='BellShopRedeemedPage_item' key={item.id}>
								{item.avatar && (
									<Avatar { ...item.avatar } />
								)}

								<div className='BellShopRedeemedPage_name'>
									{item.name}
								</div>

								{item.description && (
									<Markup
										text={item.description}
										format='markdown'
									/>
								)}

								<div className='BellShopRedeemedPage_redeemed'>
									Redeemed: {item.redeemed}
								</div>

								<div className='BellShopRedeemedPage_expires'>
									Expires: {item.expires === null ? 'Never' : item.expires}
								</div>

								<div className='BellShopRedeemedPage_price'>
									Redeemed For: {item.price}
								</div>

								{item.redeemedBy && (
									<div className='BellShopRedeemedPage_redeemedBy'>
										Redeemed By: {item.redeemedBy}
									</div>
								)}
							</div>
						)}
					</Grid>
				</Section>
			</RequireUser>
		</div>
	);
}

export async function loadData(this: APIThisType) : Promise<BellShopRedeemedPageProps>
{
	const [items] = await Promise.all([
		this.query('v1/users/bell_shop/items'),
	]);

	return {items};
}

type BellShopRedeemedPageProps = {
	items: UserBellShopItemType[]
}

export default BellShopRedeemedPage;