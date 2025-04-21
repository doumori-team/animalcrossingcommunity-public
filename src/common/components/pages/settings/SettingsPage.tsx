import { Outlet } from 'react-router';

import { RequireUser } from '@behavior';
import { Header } from '@layout';
import NavMenu from '@/components/layout/NavMenu.tsx';
import { UserContext } from '@contexts';
import { utils, routerUtils } from '@utils';

export const action = routerUtils.formAction;

const SettingsPage = () =>
{
	return (
		<RequireUser>
			<Header
				name={
					<UserContext.Consumer>
						{user => user &&
							<span>{utils.getPossessiveNoun(user.username)} Settings</span>
						}
					</UserContext.Consumer>
				}
			>
				<NavMenu>
					<NavMenu.Button path='/settings/account' index>
						Account
					</NavMenu.Button>
					<NavMenu.Button path='/settings/forum'>
						Forums
					</NavMenu.Button>
					<NavMenu.Button path='/settings/avatar'>
						Avatar
					</NavMenu.Button>
					<NavMenu.Button path='/settings/emoji'>
						Emoji
					</NavMenu.Button>
				</NavMenu>
			</Header>

			<Outlet />
		</RequireUser>
	);
};

export default SettingsPage;
