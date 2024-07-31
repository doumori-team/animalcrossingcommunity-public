import React from 'react';
import { Link, useLoaderData, Outlet } from 'react-router-dom';
import ReactDomServer from 'react-dom/server';

import { RequireUser, RequirePermission } from '@behavior';
import { utils, constants } from '@utils';
import { Keyboard, Header, Section } from '@layout';
import { APIThisType, UserLiteType, CharacterType } from '@types';

const CatalogPage = () =>
{
	const {user, characters} = useLoaderData() as CatalogPageProps;

	const encodedId = encodeURIComponent(user.id);

	return (
		<div className='CatalogPage'>
			<RequireUser>
				<Header
					name={`${utils.getPossessiveNoun(user.username)} Catalog`}
					link={`/profile/${encodedId}`}
					links={
						<RequireUser id={user.id} silent permission='modify-towns'>
							<Link to={`/profile/${encodedId}/characters/add`}>
								Add Character
							</Link>
						</RequireUser>
					}
				/>

				<Section>
					<h3>Choose a Catalog:</h3>
					<div className='Grid'>
						<RequirePermission permission='view-user-catalog'>
							<Link
								to={`/catalog/${encodedId}/${constants.town.catalogTypes.user}`}
								className='CatalogType_user'
								aria-label='User'
							>
								<p>User</p>
							</Link>
							<Link
								to={`/catalog/${encodedId}/${constants.town.catalogTypes.pc}`}
								className='ACGameButtons_game ACGameButtons_game_acpc'
								aria-label='Pocket Camp'
							>
								<p>Pocket Camp</p>
							</Link>
						</RequirePermission>
						<RequirePermission permission='view-towns'>
							{characters.map(character =>
								<Link
									key={character.id}
									to={`/catalog/${encodedId}/${constants.town.catalogTypes.character}/${encodeURIComponent(character.id)}`}
									className={`ACGameButtons_game ACGameButtons_game_modify ACGameButtons_game_${character.game.identifier}`}
									aria-label={ReactDomServer.renderToString(
										<>
										<Keyboard
											name={character.name}
											gameId={character.game.id}
										/> ({character.game.shortname}) (<Keyboard
											name={character.town.name}
											gameId={character.game.id}
										/>)
										</>
									)}
								>
									<p>
										<Keyboard
											name={character.name}
											gameId={character.game.id}
										/> ({character.game.shortname}) (<Keyboard
											name={character.town.name}
											gameId={character.game.id}
										/>)
									</p>
								</Link>
							)}
						</RequirePermission>
					</div>
				</Section>

				<Outlet />
			</RequireUser>
		</div>
	);
}

export async function loadData(this: APIThisType, {userId}: {userId: string})
{
	const [user, characters] = await Promise.all([
		this.query('v1/user_lite', {id: userId}),
		this.query('v1/users/characters', {id: userId}),
	]);

	return {
		user,
		characters,
	};
}

type CatalogPageProps = {
	user: UserLiteType
	characters: CharacterType[]
}

export default CatalogPage;
