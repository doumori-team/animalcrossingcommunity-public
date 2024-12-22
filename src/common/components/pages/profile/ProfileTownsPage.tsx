import React from 'react';
import { Link, useOutletContext, Outlet } from 'react-router-dom';

import { RequireUser, RequirePermission } from '@behavior';
import { utils, constants } from '@utils';
import { Header } from '@layout';
import { UserType } from '@types';

const ProfileTownsPage = () =>
{
	const { user } = useOutletContext() as ProfileTownsPageProps;

	const encodedId = encodeURIComponent(user.id);

	return (
		<RequirePermission permission='view-towns'>
			<div className='ProfileTownsPage'>
				<Header
					name={`${utils.getPossessiveNoun(user.username)} Towns`}
					link={`/profile/${encodedId}/towns`}
					links={
						<>
							<Link to={`/catalog/${encodedId}/${constants.town.catalogTypes.user}`}>
								User Catalog
							</Link>
							<RequireUser id={user.id} permission='modify-towns' silent>
								<Link to={`/profile/${encodedId}/towns/add`}>
									Add Town
								</Link>
							</RequireUser>
						</>
					}
				/>

				<Outlet />
			</div>
		</RequirePermission>
	);
};

type ProfileTownsPageProps = {
	user: UserType
};

export default ProfileTownsPage;
