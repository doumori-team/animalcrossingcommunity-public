import { Link } from 'react-router';

import { RequirePermission } from '@behavior';
import { Header, Section, ACGameButtons } from '@layout';
import ImageUpload from '@/components/layout/ImageUpload.tsx';
import { APIThisType, ACGameType, ACGameGuideType } from '@types';
import { routerUtils } from '@utils';

export const action = routerUtils.formAction;

const GuidesPage = ({ loaderData }: { loaderData: GuidesPageProps }) =>
{
	const { acgames, selectedGameId, guides, selectedGame } = loaderData;

	const dirPath = selectedGame?.shortname.split(':')[1].toLowerCase();

	return (
		<div className='GuidesPage'>
			<RequirePermission permission='view-guides'>
				<Header name='Guides' />

				<Section>
					<h3>Choose a Game:</h3>

					<ACGameButtons
						acgames={acgames}
						link='/guides'
					/>
				</Section>

				{!!selectedGame &&
					<>
						<ImageUpload
							directory={`images/guides/${dirPath}`}
						/>
						<Section>
							<div className='GuidesPage_header'>
								<h3>{selectedGame.name} ({selectedGame.shortname})</h3>

								{selectedGameId > 0 &&
									<RequirePermission permission='modify-guides' silent>
										<Link className='GuidesPage_button'
											to={`/guides/${encodeURIComponent(selectedGameId)}/add`}
										>
											Add Guide
										</Link>
									</RequirePermission>
								}
							</div>

							{guides.length > 0 || selectedGame.hasTown ?
								<ul>
									{selectedGame.hasTown &&
										<li className='GuidesPage_guide'>
											<Link className='GuidesPage_guideName'
												to={`/calendar?gameId=${encodeURIComponent(selectedGameId)}`}
											>
												Monthly Calendar
											</Link>
											<div className='GuidesPage_guideDescription'>
												Check out the calendar to see what special happenings and events will be going on in your AC town throughout the year.
											</div>
										</li>
									}

									{guides.map(guide =>
										<li className='GuidesPage_guide' key={guide.id}>
											<Link className='GuidesPage_guideName'
												to={`/guide/${encodeURIComponent(guide.id)}`}
											>
												{guide.name}
											</Link>
											<div className='GuidesPage_guideDescription'>
												{guide.description}
											</div>
										</li>,
									)}
								</ul>
								:
								'No guides found.'
							}
						</Section>
					</>
				}
			</RequirePermission>
		</div>
	);
};

async function loadData(this: APIThisType, { gameId }: { gameId: string }): Promise<GuidesPageProps>
{
	const selectedGameId = Number(gameId);

	const [acgames, guides, selectedGame] = await Promise.all([
		this.query('v1/acgames'),
		selectedGameId ? this.query('v1/acgame/guide', { id: selectedGameId }) : [],
		selectedGameId ? this.query('v1/acgame', { id: gameId }) : null,
	]);

	return { acgames, selectedGameId, guides, selectedGame };
}

export const loader = routerUtils.wrapLoader(loadData);

type GuidesPageProps = {
	acgames: ACGameType[]
	guides: ACGameGuideType[]
	selectedGame: ACGameType | null
	selectedGameId: number
};

export default GuidesPage;
