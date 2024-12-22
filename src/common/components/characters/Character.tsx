import React from 'react';
import { Link } from 'react-router-dom';

import { constants, utils } from '@utils';
import { CharacterType } from '@types';
import { Keyboard, ReportProblem } from '@layout';
import { RequireUser } from '@behavior';
import { Confirm } from '@form';
import Pattern from '@/components/pattern/Pattern.tsx';

const Character = ({
	id,
	name,
	game,
	bells,
	debt,
	hraScore,
	houseSizes,
	userId,
	face,
	bedLocation,
	nookMiles,
	catalogTotal,
	happyHomeNetworkId,
	creatorId,
	museumTotal,
	paint,
	monument,
	doorPattern,
	town,
}: CharacterProps) =>
{
	const encodedId = encodeURIComponent(id);
	const encodedUserId = encodeURIComponent(userId);
	const gameAbbrev = utils.getIconDirectoryFromGameID(game.id);

	const canHaveDoorPattern = game.id === constants.gameIds.ACGC || game.id === constants.gameIds.ACCF;

	return (
		<section className='Character'>
			<RequireUser id={userId} silent permission='modify-towns'>
				<div className='Character_links'>
					{canHaveDoorPattern && !doorPattern &&
						<Link to={`/profile/${encodedUserId}/character/${encodedId}/pattern`}>
							{game.id === constants.gameIds.ACGC ? 'Add Door Pattern' : 'Add House Flag'}
						</Link>
					}
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
				{face.filename &&
					<div>
						<img
							className='Character_fullbody'
							src={`${constants.AWS_URL}/images/games/${gameAbbrev}/humans/full/${face.filename}`}
							alt={face.filename}
						/>
					</div>
				}
				<div className='Character_name'>
					<ReportProblem type={constants.userTicket.types.character} id={id} />
					<Keyboard name={name} gameId={game.id} />
				</div>
			</h1>

			<ul>
				<li>Bells: {bells.toLocaleString()}</li>
				{game.id === constants.gameIds.ACNH &&
					<>
						<li>Nook Miles: {nookMiles.toLocaleString()}</li>
						<li>Happy Home Network ID: {happyHomeNetworkId ?
							happyHomeNetworkId : 'None'}</li>
						<li>Creator ID: {creatorId ?
							creatorId : 'N/A'}</li>
					</>
				}
				<li>Nook Debt: {debt.toLocaleString()}</li>
				{game.id === constants.gameIds.ACGC && monument &&
					<li>Train Station Monument: {monument?.name}</li>
				}
				{bedLocation.filename &&
					<li className='Character_dataFlexContainer'>
						<div>{game.id === constants.gameIds.ACWW ? 'Bed Location:' : 'House Location:'}</div>
						<div>&nbsp;</div>
						<img
							src={`${constants.AWS_URL}/images/character/` + bedLocation.filename}
							alt={bedLocation.filename}
						/>
					</li>
				}
				{(game.id === constants.gameIds.ACGC || game.id === constants.gameIds.ACCF) &&
					<li className='Character_dataFlexContainer'>
						<div>Roof Color:</div>
						<div>&nbsp;</div>
						{paint ?
							<>
								<div className='Character_roofColorThumbnail' style={{ backgroundColor: paint.hex }} />
								<div>&nbsp;</div>
								<div>{paint.name}</div>
							</>
							:
							<span>(not set)</span>
						}
					</li>
				}
				<li>House Size(s): {houseSizes.length === 1 ? houseSizes[0].name :
					<ul>
						{houseSizes.map(({ name }, index) =>
							<li key={index}>{name}</li>,
						)}
					</ul>
				}</li>
				<li>{game.id <= constants.gameIds.ACCF ? 'HRA' : 'HHA'} Score: {hraScore.toLocaleString()}</li>
				<li>
					Trade:{' '}<Link to={`/catalog/${encodedUserId}/${constants.town.catalogTypes.character}/${encodedId}`}>
						Catalog
					</Link>{' '}({catalogTotal}){' '}<Link to={`/catalog/${encodedUserId}/${constants.town.catalogTypes.character}/${encodedId}?category=museum`}>
						({museumTotal})
					</Link>
				</li>
			</ul>
			{
				canHaveDoorPattern && doorPattern &&
					<div className='Character_doorPatternContainer'>
						<Pattern characterId={id} townId={town.id} pattern={doorPattern} userId={userId} />
					</div>

			}
		</section>
	);
};

type CharacterProps = CharacterType;

export default Character;
