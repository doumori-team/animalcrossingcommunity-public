import React from 'react';
import { Outlet } from 'react-router-dom';

import { RequireUser } from '@behavior';
import { Header } from '@layout';
import NavMenu from '@/components/layout/NavMenu.js';
import { UserContext } from '@contexts';
import { utils } from '@utils';

const SettingsPage = () =>
{
	return (
		<RequireUser>
			<Header
				name={
					<UserContext.Consumer>
						{user => user && (
							<span>{utils.getPossessiveNoun(user.username)} Settings</span>
						)}
					</UserContext.Consumer>
				}
			>
				<NavMenu>
					<NavMenu.Button path='/settings' index>
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
}

export default SettingsPage;