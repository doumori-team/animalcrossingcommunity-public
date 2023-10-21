import React from 'react';
import PropTypes from 'prop-types';

import { RequireLargeScreen } from '@layout';
import { Form, Checkbox } from '@form';
import { permissionShape } from '@propTypes';

const Permission = ({permissions, id, action}) =>
{
	return (
		permissions && (
			<Form className='Permission_permissions' action={action} showButton key={id}>
				<input type='hidden' name='id' value={id} />

				<h3>Site Permissions</h3>
				<div className='Permission_sitePermissions'>
					{permissions.site
						.sort((a, b) => a.id - b.id)
						.map((permission, index) =>

						<div className='Permission_sitePermission' key={index}>
							<Checkbox
								type='checkbox'
								name='sitePermissionIds'
								checked={permission.granted}
								value={permission.id}
								label={permission.description}
							/>
						</div>
					)}
				</div>

				<h3>Forum Permissions</h3>
				<RequireLargeScreen size='657'>
					<div className='Permission_forumPermissions'>
						<div className='Permission_forumPermissionTypes'>
							<div className='Permission_forumPermissionType' />
							{permissions.forum.types.map((type, index) =>
								<div className='Permission_forumPermissionType' key={index}>
									{type.description}
								</div>
							)}
						</div>

						{renderBoards(permissions.forum.boards, 0)}
					</div>
				</RequireLargeScreen>
			</Form>
		)
	);
}

function renderBoards(boards, indent)
{
	return boards.map(board =>
		<React.Fragment key={board.id}>
			<div className={`Permission_forumPermission indent_${indent}`}>
				<div className='Permission_forumPermissionName'>
					{board.name}
				</div>

				{board.grantedTypes
					.sort((a, b) => a.id - b.id)
					.map(typePerm =>

					<div className='Permission_forumPermissionGranted' key={`${board.id}_${typePerm.id}`}>
						<Checkbox
							type='checkbox'
							name='forumPermissions'
							checked={typePerm.granted}
							value={`${board.id}_${typePerm.id}`}
							label={typePerm.identifier}
							hideLabel
						/>
					</div>
				)}
			</div>

			{renderBoards(board.boards, indent+1)}
		</React.Fragment>
	);
}

Permission.propTypes = {
	permissions: permissionShape,
	id: PropTypes.number.isRequired,
	action: PropTypes.string.isRequired,
};

export default Permission;
