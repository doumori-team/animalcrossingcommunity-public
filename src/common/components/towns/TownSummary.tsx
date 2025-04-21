import { Link } from 'react-router';

import { Keyboard } from '@layout';
import { constants, utils } from '@utils';
import { CharacterType, TownType } from '@types';

const TownSummary = ({ id, name, game, userId, characters, residents, island }: TownProps) =>
{
	const encodedId = encodeURIComponent(id);
	const encodedUserId = encodeURIComponent(userId);
	const gameAbbrev = utils.getIconDirectoryFromGameID(game.id);

	const characterIconImg = (character: CharacterType) =>
	{
		let url = `${constants.AWS_URL}/images/icons/character.png`;

		const hasFaceIcon = [
			constants.gameIds.ACGC,
			constants.gameIds.ACWW,
			constants.gameIds.ACCF,
			constants.gameIds.ACNL,
		].includes(game.id) && character?.face?.id && character.face.id > 0;

		if (hasFaceIcon)
		{
			url = `${constants.AWS_URL}/images/games/${gameAbbrev}/humans/icons/${character.face.filename}`;
		}

		return <img src={url} alt='player icon' className={hasFaceIcon ? '' : 'invert'} />;
	};

	return (
		<section className='TownSummary'>
			<div className='TownSummary_content'>
				<Link to={`/profile/${encodedUserId}/town/${encodedId}`}>
					<div className='TownSummary_nameContainer'>
						<div className='TownSummary_townIcon'>
							<img src={`${constants.AWS_URL}/images/games/${gameAbbrev}/town_game_icon.png`} alt='Game icon' />
						</div>
						<h3 className='TownSummary_name'>
							<Keyboard name={name} gameId={game.id} />
							<small className='TownSummary_gameName'><cite>{game.name}</cite></small>
						</h3>
					</div>
				</Link>

				<h4>Players</h4>
				{characters?.length > 0 ?
					<ul className='TownSummary_characters'>
						{characters.map(character =>
							<li key={character.id}>
								<div className='TownSummary_characterIcon'>
									{characterIconImg(character)}
								</div>
								<div className='TownSummary_characterName'>
									<Keyboard name={character.name} gameId={game.id} />
								</div>
							</li>,
						)}
					</ul>
					: <span>Not set</span>}

				<h4>Villagers</h4>
				{residents?.length > 0 ?
					<ul className='TownSummary_villagerContainer'>
						{residents.map(villager =>
							<li key={villager.id} className='TownSummary_villagerIcon'>
								<img src={utils.villagerIconUrl(villager.name, game.id)} alt={villager.name} title={villager.name} />
							</li>,
						)}
						{game.id === constants.gameIds.ACGC && island?.resident &&
							<li key='islander' className='TownSummary_villagerIcon'>
								<img src={utils.villagerIconUrl(island.resident.name, game.id)} alt={island.resident.name} title={island.resident.name} />
							</li>
						}
					</ul>
					: <span>Not set</span>}
			</div>
		</section>
	);
};

type TownProps = TownType;

export default TownSummary;
