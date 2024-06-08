import React from 'react';
import { useLoaderData } from 'react-router-dom';

import { RequireUser } from '@behavior';
import { utils, constants } from '@utils';
import { Header, Section, Grid, Markup } from '@layout';
import Avatar from '@/components/nodes/Avatar.js';

const BellShopRedeemedPage = () =>
{
	const {items} = useLoaderData();

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

								{utils.realStringLength(item.image) > 0 && (
									<img src={`${constants.AWS_URL}/images/${item.image}`}
										className='BellShopRedeemedPage_image' alt={item.name} />
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

export async function loadData()
{
	const [items] = await Promise.all([
		this.query('v1/users/bell_shop/items'),
	]);

	return {items};
}

export default BellShopRedeemedPage;