import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router';

import TreasureOffer from '@/components/layout/TreasureOffer.tsx';
import { UserContext } from '@contexts';
import { Form } from '@form';
import ContentBox from '@/components/layout/ContentBox.tsx';
import LogoutButton from '@/components/layout/LogoutButton.tsx';
import { LocationType, TreasureType } from '@types';

// The bit of the page that comes in between the header and the footer

const SiteContent = ({ treasure, children }: SiteContentProps) =>
{
	const location = useLocation() as LocationType;

	return (
		<main className='SiteContent'>
			<UserContext.Consumer>
				{currentUser =>
					<>
						{currentUser && currentUser.reviewTOS &&
							<ContentBox>
								<p><strong>IMPORTANT: We have recently updated our TOS, Site Rules, and Site Policies.</strong> In order for you to continue using the services of ACC, please carefully read the <Link to='/legal/terms'>TOS</Link>, <Link to='/guidelines'>Community Guidelines</Link> and <Link to='/legal/policies'>Site Policies</Link>. To draw attention to the new changes, we have highlighted all recent updates in <span className='TOS_updated'>blue</span> and all new updates in <span className='TOS_new'>red</span>. Once you have read these, click "Agree" below.</p>
								<div className='SiteContent_buttons'>
									<LogoutButton buttonText='Decline' />
									<Form
										action='v1/users/tos'
										showButton
										buttonText='Accept'
									/>
								</div>
							</ContentBox>
						}

						{(!currentUser || !currentUser?.reviewTOS || ['/legal/terms', '/guidelines', '/legal/policies','/legal/privacy', '/legal/cookies', '/legal/coppa'].includes(location.pathname)) &&
							<>
								{children}
								<TreasureOffer size='728x90' treasure={treasure} />
							</>
						}
					</>
				}
			</UserContext.Consumer>
		</main>
	);
};

type SiteContentProps = {
	treasure: TreasureType | null,
	children: ReactNode
};

export default SiteContent;
