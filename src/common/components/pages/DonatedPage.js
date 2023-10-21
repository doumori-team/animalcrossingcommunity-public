import React from 'react';

import { ContentBox } from '@layout';

const DonatedPage = () =>
{
	return (
		<div className='DonatedPage'>
			<ContentBox>
				<img src={`${process.env.AWS_URL}/images/layout/thank_you.png`} alt='Thank You!' />
				<div>Thank you for supporting Animal Crossing Community.</div>
			</ContentBox>
		</div>
	);
}

export default DonatedPage;