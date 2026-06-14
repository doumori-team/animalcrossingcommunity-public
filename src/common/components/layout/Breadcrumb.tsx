import { Link } from 'react-router';

import { utils } from '@utils';

const Breadcrumb = ({
	segments,
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
					<Link to={segment.url || `/forums/${encodeURIComponent(utils.safeNumber(segment?.id))}`}>
						{segment.title}
					</Link> » </span>,
			)}
		</small>
	);
};

type BreadcrumbProps = {
	segments: {
		id?: number
		title: string
		url?: string
	}[]
};

export default Breadcrumb;
