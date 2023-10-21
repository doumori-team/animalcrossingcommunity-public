import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

const Breadcrumb = ({segments}) =>
{
	if (!segments || segments.length <= 0)
	{
		return '';
	}

	return (
		<small className='Breadcrumb'>
			{segments.map((segment, index) =>
				<span key={segment.id || index}>
					<Link to={segment.url || `/forums/${encodeURIComponent(segment.id)}`}>
						{segment.title}
					</Link> » </span>
			)}
		</small>
	);
}

Breadcrumb.propTypes = {
	segments: PropTypes.arrayOf(PropTypes.shape({
		id: PropTypes.number,
		title: PropTypes.string.isRequired,
		url: PropTypes.string,
	})).isRequired,
}

export default Breadcrumb;
