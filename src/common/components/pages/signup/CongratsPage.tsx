import React from 'react';

import { RequireGroup } from '@behavior';
import { constants } from '@utils';
import { ContentBox } from '@layout';

const CongratsPage = () =>
{
	return (
		<div className='CongratsPage'>
			<RequireGroup group={constants.groupIdentifiers.anonymous}>
				<ContentBox>
					You are now a member of ACC!

					You will receive an email with a link to choose a password. Once you've chosen a password, use it to log in from the top of the page.

					Thanks for joining and welcome to our community!
				</ContentBox>
			</RequireGroup>
		</div>
	);
};

export default CongratsPage;
