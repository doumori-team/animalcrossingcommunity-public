import React from 'react';
import { Link } from 'react-router-dom';

import { RequireUser } from '@behavior';
import { constants } from '@utils';
import { ShopType } from '@types';
import { ReportProblem } from '@layout';

const Shop = ({
	shop,
}: ShopProps) =>
{
	const encodedId = encodeURIComponent(shop.id);

	return (
		<section className={shop.header ? 'Shop header' : 'Shop'}>
			<div className={shop.header ? 'Shop_img_links' : 'Shop_links'}>
				<RequireUser ids={shop.owners.map(o => o.id)} permission='modify-shops' silent>
					<Link to={`/shop/${encodeURIComponent(shop.id)}/edit`}>
						Edit
					</Link>
				</RequireUser>
				{shop.header &&
					<ReportProblem type={constants.userTicket.types.shopImage} id={shop.id} />
				}
			</div>

			{shop.header ?
				<Link to={`/shop/${encodedId}`}>
					<img
						alt={shop.name}
						src={shop.header}
						className='Shop_header'
					/>
				</Link>
				:
				<>
					<h1 className='Shop_name'>
						<ReportProblem type={constants.userTicket.types.shopName} id={shop.id} />
						<Link to={`/shop/${encodedId}`}>{shop.name}</Link>
					</h1>

					<small className='Shop_shortDescription'>
						<ReportProblem type={constants.userTicket.types.shopShortDescription} id={shop.id} />
						<cite>{shop.shortDescription}</cite>
					</small>

					{shop.vacation &&
						<div className='Shop_vacation'>
							Vacation: {shop.vacation.formattedStartDate} - {shop.vacation.formattedEndDate}
						</div>
					}
				</>
			}
		</section>
	);
};

type ShopProps = {
	shop: ShopType
};

export default Shop;
