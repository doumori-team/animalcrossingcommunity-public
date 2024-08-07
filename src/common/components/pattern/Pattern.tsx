import React from 'react';
import { Link } from 'react-router-dom';

import { RequireUser } from '@behavior';
import { PatternType, TownType } from '@types';
import { utils, constants } from '@utils';
import { Form, Confirm } from '@form';
import { ReportProblem } from '@layout';
import { UserContext } from '@contexts';

const Pattern = ({
	pattern,
	townId,
	townUserId
}: PatternProps) =>
{
	const encodedId = encodeURIComponent(Number(pattern.id||0));
	const encodedPatternUserId = encodeURIComponent(pattern.creator.id);

	let callback = '/patterns';

	if (townId != null && townId > 0)
	{
		callback = `/profile/${encodedPatternUserId}/towns`;
	}

	return (
		<section className='Pattern'>
			<div className='Pattern_links'>
				<RequireUser id={pattern.creator.id} permission='modify-patterns' silent>
					{!pattern.published &&
						<Link to={`/pattern/${encodedId}/edit`}>
							Edit
						</Link>
					}
					{pattern.id && (
						<Confirm
							action='v1/pattern/destroy'
							callback={callback}
							id={pattern.id}
							label='Delete'
							message='Are you sure you want to delete this pattern?'
						/>
					)}
				</RequireUser>
				<RequireUser silent>
					{pattern.isFavorite != null && (
						<Form
							action='v1/pattern/favorite'
							showButton
							buttonText={pattern.isFavorite ? 'Remove Favorite' : 'Favorite'}
						>
							<input type='hidden' name='patternId' value={pattern.id} />
						</Form>
					)}
				</RequireUser>
				{(townId != null && townId > 0) ?
					<RequireUser id={townUserId} silent>
						<Confirm
							action='v1/town/pattern/destroy'
							callback={callback}
							id={townId}
							label='Remove From Town'
							message='Are you sure you want to remove the pattern from this town?'
						/>
					</RequireUser>
				:
					<RequireUser silent><Link to={`/pattern/${encodedId}/choose`}>Use as Town Flag</Link></RequireUser>
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
							<ReportProblem type={pattern.id ? constants.userTicket.types.pattern : constants.userTicket.types.townFlag} id={pattern.id ? pattern.id : Number(townId||0)} />
							{pattern.id ? (
								<Link to={`/pattern/${encodedId}`}>{townId ? 'Town Flag: ' : ''}{pattern.name}</Link>
							) : (
								<>{townId ? 'Town Flag: ' : ''}{pattern.name}</>
							)}
						</div>
						{' '}
						<small className='Pattern_submitted'>
							<cite>
								<UserContext.Consumer>
									{currentUser => (
										currentUser ? (
											<>
											(submitted by <Link to={`/profile/${encodeURIComponent(pattern.creator.id)}`}>{pattern.creator.username}</Link>{pattern.formattedDate != null && ` on ${pattern.formattedDate}`})
											</>
										) : (
											<>
											(submitted by {pattern.creator.username}{pattern.formattedDate != null && ` on ${pattern.formattedDate}`})
											</>
										)
									)}
								</UserContext.Consumer>
							</cite>
						</small>
					</h1>

					<div className='Pattern_compatibility'>
						Made with {pattern.gameShortName} colors
					</div>

					{utils.realStringLength(pattern.designId) > 0 && (
						<div className='Pattern_designId'>
							Design ID: {pattern.designId}
						</div>
					)}
				</div>
			</div>
		</section>
	);
}

type PatternProps = {
	pattern: PatternType|NonNullable<TownType['flag']>
	townId?: number
	townUserId?: number
};

export default Pattern;
