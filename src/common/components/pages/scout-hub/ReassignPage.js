import React from 'react';
import { Link, useLoaderData } from 'react-router-dom';

import { RequirePermission } from '@behavior';
import { constants, dateUtils } from '@utils';
import { Form } from '@form';
import { Header, Section } from '@layout';

const ReassignPage = () =>
{
	const {adoptionTotals, adoptee} = useLoaderData();

	return (
		<div className='ReassignPage'>
			<RequirePermission permission='adoption-reassign'>
				<Header
					name='Scout Hub'
					links={
						<>
						<Link to={`/scout-hub`}>Scout Hub</Link>
						<Link to={`/scout-hub/new-members`}>New Members</Link>
						<Link to={`/scout-hub/adoption/${encodeURIComponent(constants.boardIds.adopteeBT)}`}>
							Adoptee BT
						</Link>
						<RequirePermission permission='adoption-bt-settings' silent>
							<Link to={`/scout-hub/adoption/settings`}>
								Adoptee BT Settings
							</Link>
						</RequirePermission>
						</>
					}
				/>

				<Section>
					<p>
						Select a scout to whom this new member will be reassigned.
						New Member: {adoptee.username} -- Current Scout: {adoptee.scoutUsername}
					</p>

					<div className='Grid'>
						{adoptionTotals.map(({scout, total}, index) =>
							<div key={index} className='ReassignPage_scout'>
								<div className='ReassignPage_user'>
									Scout: <Link to={`/profile/${encodeURIComponent(scout.id)}`}>
										{scout.username}
									</Link>
								</div>

								<div className='ReassignPage_total'>
									Total Adoptions: {total}
								</div>

								<div className='ReassignPage_away'>
									{(scout.awayStartDate && scout.awayEndDate) && (
										<>
										Away from {dateUtils.formatDate(scout.awayStartDate)} to {dateUtils.formatDate(scout.awayEndDate)}
										</>
									)}
								</div>

								<div className='ReassignPage_actions'>
									<Form
										action='v1/scout_hub/reassign'
										callback={`/scout-hub/new-members`}
										showButton
										buttonText='Reassign'
									>
										<input type='hidden' name='adopteeId' value={adoptee.id} />
										<input type='hidden' name='scoutId' value={scout.id} />
									</Form>
								</div>
							</div>
						)}
					</div>
				</Section>
			</RequirePermission>
		</div>
	);
}

export async function loadData({adopteeId})
{
	const [adoptionTotals, adoptee] = await Promise.all([
		this.query('v1/scout_hub/adoption/totals'),
		this.query('v1/user', {id: adopteeId}),
	]);

	return {adoptionTotals, adoptee};
}

export default ReassignPage;
