import React from 'react';
import { Link, useLocation } from 'react-router-dom';

import TreasureOffer from '@/components/layout/TreasureOffer.js';
import { UserContext } from '@contexts';
import { Form } from '@form';
import ContentBox from '@/components/layout/ContentBox.js';
import LogoutButton from '@/components/layout/LogoutButton.js';

// The bit of the page that comes in between the header and the footer

const SiteContent = ({children}) =>
{
	const location = useLocation();

	return (
		<main className='SiteContent'>
			<UserContext.Consumer>
				{currentUser => (
					<>
					{(currentUser && currentUser.reviewTOS) && (
						<ContentBox>
							<p><strong>IMPORTANT: We have recently updated our TOS, Site Rules, and Site Policies.</strong> In order for you to continue using the services of ACC, please carefully read the <Link to='/legal/terms'>TOS</Link>, <Link to='/guidelines'>Site Guidelines</Link> and <Link to='/legal/policies'>Site Policies</Link>. To draw attention to the new changes, we have highlighted all recent updates in <span className='TOS_updated'>blue</span> and all new updates in <span className='TOS_new'>red</span>. Once you have read these, click "Agree" below.</p>
							<div className='SiteContent_buttons'>
								<LogoutButton buttonText='Decline' />
								<Form
									action='v1/users/tos'
									showButton
									buttonText='Accept'
								/>
							</div>
						</ContentBox>
					)}

					{(!currentUser || !currentUser?.reviewTOS || ['/legal/terms', '/guidelines', '/legal/policies','/legal/privacy', '/legal/cookies', '/legal/coppa'].includes(location.pathname)) && (
						<>
						{children}
						<TreasureOffer size='728x90' />
						</>
					)}
					</>
				)}
			</UserContext.Consumer>
		</main>
	);
}

export default SiteContent;
