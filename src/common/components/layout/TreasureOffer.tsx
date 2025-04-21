import { Form } from '@form';
import { TreasureType } from '@types';

const TreasureOffer = ({
	treasure,
	size,
}: TreasureOfferProps) =>
{
	return (
		<div className='TreasureOffer'>
			{treasure !== null &&
				<Form action='v1/treasure/claim' messagesAtBottom formId={`treasure-claim=${treasure.id}`}>
					<input type='hidden' name='id' value={treasure.id} />

					<input
						type='image'
						src={`/images/bells/treasure_${size}_${treasure.treasureTypeId}.png`}
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
};

export default TreasureOffer;
