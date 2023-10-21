import React from 'react';
import { Link } from 'react-router-dom';

import { RequireUser } from '@behavior';
import { constants } from '@utils';
import { townShape } from '@propTypes';
import { Keyboard, Grid, InnerSection, ReportProblem } from '@layout';
import Map from '@/components/towns/Map.js';
import Tune from '@/components/tunes/Tune.js';
import { UserContext } from '@contexts';
import { Confirm } from '@form';
import Character from '@/components/characters/Character.js';
import Pattern from '@/components/pattern/Pattern.js';

const Town = ({id, name, game, userId, fruit, nativeFruit, grassShape,
	dreamAddress, ordinance, stores, pwps, residents, island, characters,
	mapTiles, hemisphere, tune, museum, mapDesignData, flag}) =>
{
	const encodedId = encodeURIComponent(id);
	const encodedUserId = encodeURIComponent(userId);

	return (
		<section className='Town'>
			<RequireUser id={userId} silent permission='modify-towns'>
				<div className='Town_links'>
					<Link to={`/profile/${encodedUserId}/town/${encodedId}/edit`}>
						Edit
					</Link>
					<Confirm
						action='v1/town/destroy'
						callback={`/profile/${encodedUserId}/towns`}
						id={id}
						label='Delete'
						message='Are you sure you want to delete this town?'
					/>
					{(game.id === constants.gameIds.ACNH && mapDesignData.dataUrl.length === 0) &&
						<Link to={`/profile/${encodedUserId}/town/${encodedId}/map`}>
							Add Map
						</Link>
					}
				</div>
			</RequireUser>

			<h1 className='Town_name'>
				<div>
					<ReportProblem type={constants.userTicket.types.town} id={id} />
					<Keyboard name={name} gameId={game.id} />
				</div>
				{' '}
				<small className='Town_gameName'><cite>{game.name}</cite></small>
			</h1>

			{(mapTiles.length > 0 || mapDesignData.dataUrl.length > 0) && (
				<div className={`Town_map Town_map_${game.identifier}`}>
					{game.id === constants.gameIds.ACNH ? (
						<img
							className={`Town_map_${game.identifier}`}
							src={mapDesignData.dataUrl}
							alt='AC:NH Map'
						/>
					) : (
						<Map game={game} mapTiles={mapTiles} />
					)}
					<div>
						<ReportProblem type={constants.userTicket.types.map} id={id} />
						<RequireUser id={userId} silent>
							<Link to={`/profile/${encodedUserId}/town/${encodedId}/map`}
								className='Town_mapEditLink'>Edit Map</Link>
						</RequireUser>
					</div>
				</div>
			)}

			{tune ?
				<InnerSection>
					<Tune townId={id} tune={tune} townUserId={userId} />
				</InnerSection>
			:
				<RequireUser id={userId} silent>
					<InnerSection>
						<Link to={`/profile/${encodedUserId}/town/${encodedId}/tune`}
							className='Town_button'>
							Add Town Tune
						</Link>
					</InnerSection>
				</RequireUser>
			}

			{flag ?
				<InnerSection>
					<Pattern townId={id} pattern={flag} townUserId={userId} />
				</InnerSection>
			:
				<RequireUser id={userId} silent>
					<InnerSection>
						<Link to={`/profile/${encodedUserId}/town/${encodedId}/pattern`}
							className='Town_button'>
							Add Town Flag
						</Link>
					</InnerSection>
				</RequireUser>
			}

			<InnerSection>
				<h2 className='Town_sectionHeading'>
					<div className='Town_characterHeader'>
						<div>
							<img src={`${process.env.AWS_URL}/images/icons/character.png`}
								className='Town_sectionHeadingIcon' alt='Characters' />
							Characters
						</div>
						<RequireUser id={userId} silent>
							<Link to={`/profile/${encodedUserId}/characters/add/${encodedId}`}
								className='Town_button'>Add</Link>
						</RequireUser>
					</div>
				</h2>

				<Grid options={characters} message={
					<UserContext.Consumer>
						{currentUser => (currentUser && currentUser.id === userId) ? (
							<div>
								{'You have no characters set up. '}
								<Link to={`/profile/${encodedUserId}/characters/add/${encodedId}`}>{'Click here'}</Link>
								{' to add a new character.'}
							</div>
						) : (
							'No characters in this town.'
						)}
					</UserContext.Consumer>
				}>
					{characters.map(character =>
						<Character key={character.id} {...character} />
					)}
				</Grid>
			</InnerSection>

			<InnerSection>
				<h2 className='Town_sectionHeading'>
					<img src={`${process.env.AWS_URL}/images/icons/museum.png`} className='Town_sectionHeadingIcon' alt='Museum' />
					Museum
				</h2>
				<ul>
					{museum.map(category =>
						<li key={category.name}>{category.name}: {category.count}/{category.total}</li>
					)}
				</ul>
			</InnerSection>

			<InnerSection>
				<h2 className='Town_sectionHeading'>
					<img src={`${process.env.AWS_URL}/images/icons/fruit.png`} className='Town_sectionHeadingIcon' alt='Fruit' />
					Fruit
				</h2>
				{fruit.length > 0 ? (
					<>
					<ul>
						{fruit.map(fruit =>
							<li key={fruit.id}>
								{fruit.name}{nativeFruit.all.some(f => f.id === fruit.id) && '*'}
							</li>
						)}
					</ul>
					<div className='Town_note'>
						* denotes native fruit
					</div>
					</>
				) : (
					'None'
				)}
			</InnerSection>

			<InnerSection>
				<h2 className='Town_sectionHeading'>
					<img src={`${process.env.AWS_URL}/images/icons/villagers.png`} className='Town_sectionHeadingIcon' alt='Villagers' />
					Villagers
				</h2>
				{residents.length > 0 ? (
					<ul>
						{residents.map(({id, name}) =>
							<li key={id}>{name}</li>
						)}
					</ul>
				) : (
					'None'
				)}
			</InnerSection>

			<InnerSection>
				<h2 className='Town_sectionHeading'>
					<img src={`${process.env.AWS_URL}/images/icons/leaf.png`} className='Town_sectionHeadingIcon' alt='Additional Information' />
					Additional Information
				</h2>
				<ul>
					{game.id !== constants.gameIds.ACNH && (
						<li>Nook: {stores.nook.length > 0 ?
							stores.nook[stores.nook.length - 1].name : '(not set)'}</li>
					)}

					{game.id === constants.gameIds.ACGC && (
						<li>Island Info: Name: {island ?
							<Keyboard name={island.name} gameId={game.id} /> :
							'None'} | Islander: {island && island.resident ?
								island.resident.name : 'None'}</li>
					)}

					{game.id <= constants.gameIds.ACNL && (
						<li>Grass Shape: {grassShape.name ? grassShape.name : 'None'}</li>
					)}

					{[constants.gameIds.ACNL, constants.gameIds.ACNH].includes(game.id) && (
						<>
							<li>Dream Address: {dreamAddress ? dreamAddress : 'None'}</li>
							<li>Ordinance: {ordinance.name ? ordinance.name : 'None'}</li>
						</>
					)}

					{game.id === constants.gameIds.ACNL && (
						<>
							<li>Other Shops and Amenities: {stores.others.length === 0 ?
								'No shops set for this town.' :
								(
									<ul>
										{stores.others.map(({name}, index) =>
											<li key={index}>{name}</li>
										)}
									</ul>
								)}
							</li>
							<li>Public Work Projects: {pwps.length === 0 ?
								'No public works projects set for this town.' :
								(
									<ul>
										{pwps.map(({name}, index) =>
											<li key={index}>{name}</li>
										)}
									</ul>
								)}
							</li>
						</>
					)}

					{game.id === constants.gameIds.ACNH && (
						<li>Hemisphere: {hemisphere.name ? hemisphere.name : 'None'}</li>
					)}
				</ul>
			</InnerSection>
		</section>
	);
}

Town.propTypes = {
	townShape
};

export default Town;
