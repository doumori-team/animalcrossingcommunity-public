import React from 'react';
import { Link } from 'react-router-dom';

import { RequirePermission } from '@behavior';
import { constants } from '@utils';
import { ratingShape } from '@propTypes';
import { ReportProblem } from '@layout';

const Rating = ({rating}) =>
{
	if (rating === null)
	{
		return 'No rating given.'
	}

	const configsByRating = constants.rating.configs[rating.rating];

	return (
		<div className='Rating'>
			<div className='Rating_links'>
				<RequirePermission permission='use-trading-post' silent>
					{rating.listingId && (
						<Link to={`/trading-post/${encodeURIComponent(rating.listingId)}`}>
							View Trading Post Interaction
						</Link>
					)}
				</RequirePermission>
				{rating.adoptionNodeId && (
					<Link to={`/scout-hub/adoption/${encodeURIComponent(rating.adoptionNodeId)}`}>
						View Scout Thread
					</Link>
				)}
			</div>

			<div className='Rating_rating'>
				<ReportProblem type={constants.userTicket.types.rating} id={rating.id} />
				<label>Rating: </label>
				<img
					alt={configsByRating.imageAlt}
					src={`${process.env.AWS_URL}/images/rating/${configsByRating.image}`}
				/>
			</div>

			{rating.comment && (
				<div className='Rating_comment'>
					<label>Comment: </label>
					{rating.comment}
				</div>
			)}

			<div className='Rating_user'>
				<label>User: </label>
				{rating.username}
			</div>

			<div className='Rating_user'>
				<label>Rating User: </label>
				{rating.ratingUsername}
			</div>

			<div className='Rating_lastUpdated'>
				<label>Last Updated: </label>
				{rating.formattedDate}
			</div>
		</div>
	);
}

Rating.propTypes = {
	rating: ratingShape,
};

export default Rating;
