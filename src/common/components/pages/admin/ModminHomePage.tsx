import { Link } from 'react-router';

import { RequirePermission } from '@behavior';
import { Header, Section } from '@layout';
import { routerUtils } from '@utils';

export const action = routerUtils.formAction;

const ModminHomePage = () =>
{
	return (
		<div className='ModminHomePage'>
			<RequirePermission permission='modmin-pages'>
				<Header
					name='Modmin Pages'
				/>

				<Section>
					<ul>
						<RequirePermission permission='process-user-tickets' silent>
							<li><Link to={`/user-tickets`}>User Tickets</Link></li>
							<li><Link to={`/user-matching`}>User Matching</Link></li>
							<li><Link to={`/user-sessions`}>User Sessions</Link></li>
							<li><Link to={`/support-emails`}>Support Emails</Link></li>
						</RequirePermission>
						<RequirePermission permission='process-support-tickets' silent>
							<li><Link to={`/support-tickets`}>Support Tickets</Link></li>
						</RequirePermission>
						<RequirePermission permission='view-rules-admin' silent>
							<li><Link to='/rules'>
								Rules Admin
							</Link></li>
						</RequirePermission>
						<RequirePermission permission='profanity-admin' silent>
							<li><Link to='/profanity'>
								Profanity Admin
							</Link></li>
						</RequirePermission>
					</ul>
				</Section>
			</RequirePermission>
		</div>
	);
};

export default ModminHomePage;
