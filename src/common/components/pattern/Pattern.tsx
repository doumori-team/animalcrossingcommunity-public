import React from 'react';
import { Link } from 'react-router-dom';

import { RequireUser } from '@behavior';
import { PatternType, TownType } from '@types';
import { utils, constants } from '@utils';
import { Form, Confirm } from '@form';
import { ReportProblem } from '@layout';
import { UserContext } from '@contexts';

enum CONTEXT
{
	CHARACTER = 'character',
	TOWN = 'town',
	NONE = 'none',
}

const Pattern = ({
	pattern,
	townId,
	userId,
	characterId,
}: PatternProps) =>
{
	const encodedId = encodeURIComponent(Number(pattern.id || 0));
	const encodedPatternUserId = encodeURIComponent(pattern.creator.id);
	const encodedTownId = encodeURIComponent(Number(townId || 0));

	const shouldAllowHousePattern = pattern.gameId === constants.gameIds.ACGC || pattern.gameId === constants.gameIds.ACCF;

	let callback = '/patterns';

	if (townId)
	{
		callback = `/profile/${encodedPatternUserId}/town/${encodedTownId}`;
	}

	const context = () =>
	{
		if (characterId)
		{
			return CONTEXT.CHARACTER;
		}

		if (townId)
		{
			return CONTEXT.TOWN;
		}
		return CONTEXT.NONE;
	};

	const prefix = () =>
	{
		if (characterId && pattern.gameId === constants.gameIds.ACGC)
		{
			return 'Door pattern: ';
		}

		if (characterId && pattern.gameId === constants.gameIds.ACCF)
		{
			return 'House flag: ';
		}

		if (townId && pattern.gameId === constants.gameIds.ACGC)
		{
			return 'Island flag: ';
		}

		if (townId)
		{
			return 'Town flag: ';
		}
		return '';
	};

	return (
		<section className='Pattern'>
			<div className='Pattern_links'>
				{context() === CONTEXT.NONE &&
					<>
						<RequireUser id={pattern.creator.id} permission='modify-patterns' silent>
							{!pattern.published &&
								<Link to={`/pattern/${encodedId}/edit`}>
									Edit
								</Link>
							}
							{pattern.id &&
								<Confirm
									action='v1/pattern/destroy'
									callback={callback}
									id={pattern.id}
									label='Delete'
									message='Are you sure you want to delete this pattern?'
								/>
							}
						</RequireUser>
						<RequireUser silent>
							{pattern.isFavorite != null &&
								<Form
									action='v1/pattern/favorite'
									showButton
									buttonText={pattern.isFavorite ? 'Remove Favorite' : 'Favorite'}
								>
									<input type='hidden' name='patternId' value={pattern.id} />
								</Form>
							}
							<Link to={`/pattern/${encodedId}/choose/town`}>
								{pattern.gameId === constants.gameIds.ACGC ?
									'Use as Island Flag' :
									'Use as Town Flag'}
							</Link>
							{shouldAllowHousePattern &&
								<Link to={`/pattern/${encodedId}/choose/door`}>
									{pattern.gameId === constants.gameIds.ACGC ?
										'Use as Door Pattern' :
										'Use as House Flag'}
								</Link>
							}
						</RequireUser>
					</>
				}

				{context() === CONTEXT.TOWN &&
					<RequireUser id={userId} silent>
						<Confirm
							action='v1/town/pattern/destroy'
							callback={callback}
							id={townId}
							label={pattern.gameId === constants.gameIds.ACGC ? 'Remove From Island' : 'Remove From Town'}
							message='Are you sure you want to remove the pattern from this town?'
						/>
					</RequireUser>
				}

				{context() === CONTEXT.CHARACTER &&
					<RequireUser id={userId} silent>
						<Confirm
							action='v1/character/pattern/destroy'
							callback={callback}
							id={characterId}
							label={pattern.gameId === constants.gameIds.ACGC ? 'Remove From Door' : 'Remove From Flagpole'}
							message={`Are you sure you want to remove the pattern from this character?`}
						/>
					</RequireUser>
				}
			</div>

			<div className='Pattern_row'>
				<img
					alt='Pattern'
					src={pattern.dataUrl}
					className='Pattern_image'
				/>

				<div className='Pattern_column'>
					<h1 className='Pattern_name'>
						<div>
							<ReportProblem type={pattern.id ? constants.userTicket.types.pattern : constants.userTicket.types.townFlag} id={pattern.id ? pattern.id : Number(townId || 0)} />
							{pattern.id ?
								<Link to={`/pattern/${encodedId}`}>{prefix()}{pattern.name}</Link>
								:
								<>{prefix()}{pattern.name}</>
							}
						</div>
						{' '}
						<small className='Pattern_submitted'>
							<cite>
								<UserContext.Consumer>
									{currentUser =>
										currentUser ?
											<>
												(submitted by <Link to={`/profile/${encodeURIComponent(pattern.creator.id)}`}>{pattern.creator.username}</Link>{pattern.formattedDate && ` on ${pattern.formattedDate}`})
											</>
											:
											<>
												(submitted by {pattern.creator.username}{pattern.formattedDate && ` on ${pattern.formattedDate}`})
											</>

									}
								</UserContext.Consumer>
							</cite>
						</small>
					</h1>

					<div className='Pattern_compatibility'>
						Made with {pattern.gameShortName} colors
					</div>

					{utils.realStringLength(pattern.designId) > 0 &&
						<div className='Pattern_designId'>
							Design ID: {pattern.designId}
						</div>
					}
				</div>
			</div>
		</section>
	);
};

type PatternProps = {
	pattern: PatternType | NonNullable<TownType['flag']>
	townId?: number
	userId?: number
	characterId?: number
};

export default Pattern;
