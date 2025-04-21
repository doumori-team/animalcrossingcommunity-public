import { constants } from '@utils';

const TotalRatings = ({
	positiveRatingsTotal,
	neutralRatingsTotal,
	negativeRatingsTotal,
	type,
}: TotalRatingsProps) =>
{
	return (
		<div className='TotalRatings'>
			Total <span className='capitalize'>{type}</span> Ratings:
			{' '}<img alt={constants.rating.configs.positive.imageAlt} src={`${constants.AWS_URL}/images/rating/${constants.rating.configs.positive.image}`} /> {positiveRatingsTotal}
			{' '}<img alt={constants.rating.configs.neutral.imageAlt} src={`${constants.AWS_URL}/images/rating/${constants.rating.configs.neutral.image}`} /> {neutralRatingsTotal}
			{' '}<img alt={constants.rating.configs.negative.imageAlt} src={`${constants.AWS_URL}/images/rating/${constants.rating.configs.negative.image}`} /> {negativeRatingsTotal}
		</div>
	);
};

type TotalRatingsProps = {
	positiveRatingsTotal: number
	neutralRatingsTotal: number
	negativeRatingsTotal: number
	type: string
};

export default TotalRatings;
