import React from 'react';
import { Link } from 'react-router-dom';

import { constants } from '@utils';
import { characterShape } from '@propTypes';
import { Keyboard, ReportProblem } from '@layout';
import { RequireUser } from '@behavior';
import { Confirm } from '@form';

const Character = ({id, name, game, bells, debt, hraScore, houseSizes, userId, face,
	bedLocation, nookMiles, catalogTotal, happyHomeNetworkId, creatorId}) =>
{
	const encodedId = encodeURIComponent(id);
	const encodedUserId = encodeURIComponent(userId);

	return (
		<section className='Character'>
			<RequireUser id={userId} silent permission='modify-towns'>
				<div className='Character_links'>
					<Link to={`/profile/${encodedUserId}/character/${encodedId}/edit`}>
						Edit
					</Link>
					<Confirm
						action='v1/character/destroy'
						callback={`/profile/${encodedUserId}/towns`}
						id={id}
						label='Delete'
						message='Are you sure you want to delete this character?'
					/>
				</div>
			</RequireUser>

			<h1 className='Character_face'>
				{face.filename && (
					<div>
						<img
							src={`${process.env.AWS_URL}/images/character/` + face.filename}
							alt={face.filename}
						/>
					</div>
				)}
				<div className='Character_name'>
					<ReportProblem type={constants.userTicket.types.character} id={id} />
					<Keyboard name={name} gameId={game.id} />
				</div>
			</h1>

			<ul>
				<li>Bells: {bells.toLocaleString()}</li>
				{game.id === constants.gameIds.ACNH && (
					<>
						<li>Nook Miles: {nookMiles.toLocaleString()}</li>
						<li>Happy Home Network ID: {happyHomeNetworkId ?
							happyHomeNetworkId : 'None'}</li>
						<li>Creator ID: {creatorId ?
							creatorId : 'N/A'}</li>
					</>
				)}
				<li>Nook Debt: {debt.toLocaleString()}</li>
				<li>House Size(s): {houseSizes.length === 1 ? houseSizes[0].name : (
					<ul>
						{houseSizes.map(({name}, index) =>
							<li key={index}>{name}</li>
						)}
					</ul>
				)}</li>
				<li>{game.id <= constants.gameIds.ACCF ? 'HRA' : 'HHA'} Score: {hraScore.toLocaleString()}</li>
				{bedLocation.filename && (
					<li>{game.id === constants.gameIds.ACGC ? 'House Location:' : 'Bed Location:'}
						{' '}<img
							src={`${process.env.AWS_URL}/images/character/` + bedLocation.filename}
							alt={bedLocation.filename}
						/>
					</li>
				)}
				<li>
					Trade:{' '}<Link to={`/catalog/${encodedUserId}/${constants.town.catalogTypes.character}/${encodedId}`}>
						Catalog
					</Link>{' '}({catalogTotal})
				</li>
			</ul>
		</section>
	);
}

Character.propTypes = {
	characterShape
};

export default Character;
