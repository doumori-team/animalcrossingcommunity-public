import { Form } from '@form';
import { TreasureType, TreasureLocationType } from '@types';
import { constants } from '@utils';

const TreasureOffer = ({
	treasure,
	size,
	location,
}: TreasureOfferProps) =>
{
	return (
		<div className='TreasureOffer'>
			{treasure !== null && treasure.location === location &&
				<Form action='v1/treasure/claim' messagesAtBottom formId={`treasure-claim=${treasure.id}`}>
					<input type='hidden' name='id' value={treasure.id} />

					<input
						type='image'
						src={
							constants.allImages[
    							`bells/treasure_${size}_${treasure.treasureTypeId}.png`
							]
						}
						aria-label='Treasure Offer'
						alt='Treasure Offer'
					/>
				</Form>
			}
		</div>
	);
};

type TreasureOfferProps = {
	treasure: TreasureType | null
	size: string
	location: TreasureLocationType
};

export default TreasureOffer;
