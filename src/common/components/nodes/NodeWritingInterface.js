import React from 'react';
import PropTypes from 'prop-types';

import { Form, RichTextArea, Text, Select, Switch } from '@form';
import { constants } from '@utils';
import { emojiSettingsShape, fileShape } from '@propTypes';
import { UserContext } from '@contexts';

const NodeWritingInterface = ({parentId, parentType, permissions, lastPage,
	addUsers, nodeParentId, threadType, parentTitle, parentContent, threadId,
	emojiSettings, boards, nodeUserId, markupStyle, files}) =>
{
	let callback, title;

	const callbackPrefix = (constants.boardIds.adopteeThread === parentId ||
		nodeParentId === constants.boardIds.adopteeThread) ? 'scout-hub/adoption' : 'forums';

	// If we're currently on a board:
	if (parentType === 'board')
	{
		callback = `/${callbackPrefix}/:id`; // After the new thread is created, go straight to it.
		title = 'Post a new thread';
	}
	// If not:
	else
	{
		callback = `/${callbackPrefix}/${threadId}`; // Stay where we are after creating the post
		title = 'Reply to this thread';
	}

	if (lastPage && parentType !== 'board')
	{
		callback += `/${encodeURIComponent(lastPage)}`;
	}

	if (parentType !== 'board')
	{
		callback += `?reload=`;
	}

	let threadTypes = [{value: 'normal', label: 'Normal'}];

	if (permissions.includes('sticky'))
	{
		threadTypes.push({value: 'sticky', label: 'Sticky'});
	}

	if (permissions.includes('admin-lock'))
	{
		threadTypes.push({value: 'admin', label: 'Lock'});
	}

	return (
		<fieldset className='NodeWritingInterface'>
			<Form action='v1/node/create' callback={callback} showButton>
				<div role='group'>
					<h1 className='NodeWritingInterface_heading'>
						{title}
					</h1>

					{permissions.includes('lock') && (
						<div className='NodeWritingInterface_lock'>
							<Switch
								name='lock'
								label='Lock Thread'
								variant='light'
							/>
						</div>
					)}

					{threadTypes.length > 1 && (
						<Select
							hideLabel
							name='type'
							options={threadTypes}
							label='Select thread type'
							value={threadType}
						/>
					)}
				</div>

				<input name='parentId' type='hidden' value={parentId} />

				{(parentType === 'board' || permissions.includes('edit')) && (
					<Text
						hideLabel
						className='NodeWritingInterface_title'
						name='title'
						label='Title'
						maxLength={constants.max.postTitle}
						required
						value={parentType === 'board' ? '' : parentTitle}
					/>
				)}

				{(boards.length > 0 && permissions.includes('move') && parentType === 'thread') && (
					<Select
						label='Move Thread'
						name='boardId'
						options={boards}
						optionsMapping={{value: 'id', label: 'title'}}
						required
						value={nodeParentId}
					/>
				)}

				<UserContext.Consumer>
					{currentUser => currentUser && (
						([parentId, nodeParentId].includes(constants.boardIds.privateThreads) && (nodeUserId === currentUser.id || parentId === constants.boardIds.privateThreads)) && (
							<div className='NodeWritingInterface_usernames'>
								<Text
									name='users'
									label='Username(s)'
									maxLength={constants.max.addMultipleUsers}
									value={addUsers}
									information='Use to add users to the thread. You may add multiple users by separating their usernames with a comma. For example: jader201,aldericon'
								/>
							</div>
						)
					)}
				</UserContext.Consumer>

				<RichTextArea
					textName='text'
					formatName='format'
					key={Math.random()}
					label={title}
					textValue={parentContent.text}
					formatValue={markupStyle ? markupStyle : parentContent.format}
					emojiSettings={emojiSettings}
					maxLength={[nodeParentId, parentId].some(pid => constants.staffBoards.includes(pid)) ? constants.max.staffPost : constants.max.post}
					upload
					files={files}
				/>
			</Form>
		</fieldset>
	);
}

NodeWritingInterface.propTypes = {
	parentId: PropTypes.number.isRequired,
	parentType: PropTypes.string.isRequired,
	permissions: PropTypes.arrayOf(PropTypes.string).isRequired,
	lastPage: PropTypes.number,
	addUsers: PropTypes.string,
	nodeParentId: PropTypes.number,
	threadType: PropTypes.string,
	parentTitle: PropTypes.string,
	parentContent: PropTypes.shape({
		text: PropTypes.text,
		format: PropTypes.text,
	}),
	threadId: PropTypes.number,
	emojiSettings: emojiSettingsShape,
	nodeUserId: PropTypes.number,
	markupStyle: PropTypes.string,
	files: fileShape,
}

NodeWritingInterface.defaultProps = {
	addUsers: '',
	permissions: [],
	parentTitle: '',
	parentContent: {
		text: '',
		format: 'markdown',
	},
	boards: [],
	markupStyle: null,
	files: [],
}

export default NodeWritingInterface;
