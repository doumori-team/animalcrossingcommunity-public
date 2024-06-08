import React from 'react';
import { Link } from 'react-router-dom';

import { RequirePermission } from '@behavior';
import { Header, Section } from '@layout';
import { Form } from '@form';

const AdminHomePage = () =>
{
	return (
		<div className='AdminHomePage'>
			<RequirePermission permission='admin-pages'>
				<Header
					name='Admin Pages'
				/>

				<Section>
					<ul>
						<RequirePermission permission='permission-admin' silent>
							<li><Link to='/admin/permissions'>
								Permissions Admin
							</Link></li>
						</RequirePermission>
						<RequirePermission permission='games-admin' silent>
							<li><Link to='/admin/game-consoles'>
								Game Consoles & Games Admin
							</Link></li>
						</RequirePermission>
						<RequirePermission permission='polls-admin' silent>
							<li><Link to='/admin/weekly-polls'>
								Weekly Polls Admin
							</Link></li>
						</RequirePermission>
						<RequirePermission permission='board-admin' silent>
							<li><Link to='/admin/board'>
								Board Admin
							</Link></li>
						</RequirePermission>
					</ul>
				</Section>

				<Section>
					<p>Redis Cache is used for storing our AC data, used for things like Trading Post, Monthly Calendar, Avatars, Towns and Bell Shop. It's also used for storing API calls for non-users and some calls for all users.</p>

					<Form
						action='v1/admin/regenerate_cache/all'
						showButton
						buttonText='Regenerate Cache'
					/>
				</Section>
			</RequirePermission>
		</div>
	);
}

export default AdminHomePage;
