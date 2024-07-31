import React from 'react';
import { Link } from 'react-router-dom';

const Breadcrumb = ({
	segments
}: BreadcrumbProps) =>
{
	if (!segments || segments.length <= 0)
	{
		return '';
	}

	return (
		<small className='Breadcrumb'>
			{segments.map((segment, index) =>
				<span key={segment.id || index}>
					<Link to={segment.url || `/forums/${encodeURIComponent(Number(segment?.id||0))}`}>
						{segment.title}
					</Link> » </span>
			)}
		</small>
	);
}

type BreadcrumbProps = {
	segments: {
		id?: number
		title: string
		url?: string
	}[]
};

export default Breadcrumb;
