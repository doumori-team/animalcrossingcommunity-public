import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

import { RequireUser, RequirePermission } from '@behavior';
import { patternShape } from '@propTypes';
import { utils, constants } from '@utils';
import { Form, Confirm } from '@form';
import { ReportProblem } from '@layout';
import { UserContext } from '@contexts';

const Pattern = ({pattern, townId, townUserId}) =>
{
	const encodedId = encodeURIComponent(pattern.id);
	const encodedPatternUserId = encodeURIComponent(pattern.creator.id);

	let callback = '/patterns';

	if (townId > 0)
	{
		callback = `/profile/${encodedPatternUserId}/towns`;
	}

	return (
		<section className='Pattern'>
			<div className='Pattern_links'>
				<RequireUser id={pattern.creator.id} silent>
					<RequirePermission permission='modify-patterns' silent>
						{!pattern.published &&
							<Link to={`/pattern/${encodedId}/edit`}>
								Edit
							</Link>
						}
						<Confirm
							action='v1/pattern/destroy'
							callback={callback}
							id={pattern.id}
							label='Delete'
							message='Are you sure you want to delete this pattern?'
						/>
					</RequirePermission>
				</RequireUser>
				<RequireUser silent>
					<Form
						action='v1/pattern/favorite'
						showButton
						buttonText={pattern.isFavorite ? 'Remove Favorite' : 'Favorite'}
					>
						<input type='hidden' name='patternId' value={pattern.id} />
					</Form>
				</RequireUser>
				{townId > 0 ?
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
							<ReportProblem type={pattern.id ? constants.userTicket.types.pattern : constants.userTicket.types.townFlag} id={pattern.id ? pattern.id : townId} />
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
											(submitted by <Link to={`/profile/${encodeURIComponent(pattern.creator.id)}`}>{pattern.creator.username}</Link>{pattern.formattedDate && ` on ${pattern.formattedDate}`})
											</>
										) : (
											<>
											(submitted by {pattern.creator.username}{pattern.formattedDate && ` on ${pattern.formattedDate}`})
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

Pattern.propTypes = {
	pattern: patternShape,
	townId: PropTypes.number,
	townUserId: PropTypes.number,
};

export default Pattern;
