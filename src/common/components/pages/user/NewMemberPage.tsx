import React from 'react';
import { Link } from 'react-router-dom';

import { RequireUser } from '@behavior';
import { constants } from '@utils';
import { Form } from '@form';
import { ContentBox } from '@layout';

const NewMemberPage = () =>
{
	return (
		<div className='NewMemberPage'>
			<ContentBox>
				<RequireUser>
					Thanks for joining ACC! Since you're new, you may need help with either Animal Crossing or this site, ACC. We're glad to help you out!
					<br/><br/>
					One of the most fun ways to learn about the site is to be adopted. If you sign up for adoption, an ACC Scout will be assigned to you as your "foster" buddy. Your Scout will help you learn the ropes of ACC by getting you started with the basics of the site. They will also help you find answers to any questions you may have about the site or about Animal Crossing. If you want to sign up for adoption, simply click the 'Adopt Me' button below.
					<br/><br/>
					<Form
						action='v1/scout_hub/adopt'
						callback='/scout-hub/adoption/:id'
						showButton
						buttonText='Adopt Me'
					/>
					<br/>
					Once you're adopted, you can PT your assigned ACC Scout to ask them any questions you have. Also, feel free to browse our <Link to={`/forums/${constants.boardIds.gettingStarted}`}>New Members board</Link> to meet some new friends and get help from other ACC members.
					<br/><br/>
					Thanks again, and we hope you have fun!
					<br/><br/>
					- ACC Staff -
				</RequireUser>
			</ContentBox>
		</div>
	);
}

export default NewMemberPage;
