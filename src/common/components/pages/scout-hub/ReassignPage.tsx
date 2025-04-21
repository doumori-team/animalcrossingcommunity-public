import { Link } from 'react-router';

import { RequirePermission } from '@behavior';
import { constants, dateUtils, routerUtils } from '@utils';
import { Form } from '@form';
import { Header, Section } from '@layout';
import { APIThisType, AdoptionTotalsType, UserType } from '@types';

export const action = routerUtils.formAction;

const ReassignPage = ({ loaderData }: { loaderData: ReassignPageProps }) =>
{
	const { adoptionTotals, adoptee } = loaderData;

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
						{adoptionTotals.map(({ scout, total }, index) =>
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
									{scout.awayStartDate && scout.awayEndDate &&
										<>
											Away from {dateUtils.formatDate(scout.awayStartDate)} to {dateUtils.formatDate(scout.awayEndDate)}
										</>
									}
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
							</div>,
						)}
					</div>
				</Section>
			</RequirePermission>
		</div>
	);
};

async function loadData(this: APIThisType, { adopteeId }: { adopteeId: string }): Promise<ReassignPageProps>
{
	const [adoptionTotals, adoptee] = await Promise.all([
		this.query('v1/scout_hub/adoption/totals'),
		this.query('v1/user', { id: adopteeId }),
	]);

	return { adoptionTotals, adoptee };
}

export const loader = routerUtils.wrapLoader(loadData);

type ReassignPageProps = {
	adoptionTotals: AdoptionTotalsType[]
	adoptee: UserType
};

export default ReassignPage;
