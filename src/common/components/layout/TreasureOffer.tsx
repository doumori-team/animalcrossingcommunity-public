import React from 'react';

import { Form } from '@form';
import { TreasureContext } from '@contexts';

const TreasureOffer = ({
	size
}: TreasureOfferProps) =>
{
    return (
        <div className='TreasureOffer'>
            <TreasureContext.Consumer>
                {treasure => treasure !== null && (
                    <Form action='v1/treasure/claim' messagesAtBottom={false}>
                        <input type='hidden' name='id' value={treasure.id} />

                        <input
                            type='image'
                            src={`/images/bells/treasure_${size}_${treasure.treasureTypeId}.png`}
                            aria-label='Treasure Offer'
                            alt='Treasure Offer'
                        />
                    </Form>
                )}
            </TreasureContext.Consumer>
        </div>
    );
}

type TreasureOfferProps = {
	size: string
};

export default TreasureOffer;
