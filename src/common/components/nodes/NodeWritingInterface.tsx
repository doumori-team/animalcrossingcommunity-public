import { useState } from 'react';

import { Form, RichTextArea, Text, Select, Switch, Button } from '@form';
import { constants, utils } from '@utils';
import { EmojiSettingType, FileType, NodeBoardType, UserDonationsType, MarkupFormatType, MarkupStyleType, ClickHandlerType } from '@types';
import { RequireClientJS } from '@behavior';
import { iso } from 'common/iso.ts';

const NodeWritingInterface = ({
	parentId,
	parentType,
	permissions = [],
	lastPage,
	addUsers = '',
	nodeParentId,
	threadType,
	parentTitle = '',
	parentContent,
	threadId,
	emojiSettings,
	boards = [],
	markupStyle,
	files = [],
	staffBoards = [],
	userDonations,
	liveMode,
	setLiveMode,
	text,
	setText,
}: NodeWritingInterfaceProps) =>
{
	const [loading, setLoading] = useState<boolean>(false);
	const [textareaKey, setTextareaKey] = useState(Math.random());

	let callback, title, callbackPrefix = 'forums';

	if (constants.boardIds.adopteeThread === parentId || nodeParentId === constants.boardIds.adopteeThread)
	{
		callbackPrefix = 'scout-hub/adoption';
	}
	else if (constants.boardIds.shopThread === parentId || nodeParentId === constants.boardIds.shopThread)
	{
		callbackPrefix = 'shops/threads';
	}

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

		if (lastPage)
		{
			callback += `/${encodeURIComponent(lastPage)}?reload=:id`;
		}
	}

	let threadTypes = [{ value: 'normal', label: 'Normal' }];

	if (permissions.includes('sticky'))
	{
		threadTypes.push({ value: 'sticky', label: 'Sticky' });
	}

	if (permissions.includes('admin-lock'))
	{
		threadTypes.push({ value: 'admin', label: 'Lock' });
	}

	let postId = '';

	if (typeof window !== 'undefined')
	{
		postId = window.location.hash.substring(1);
	}

	const sendPost = async () =>
	{
		setLoading(true);

		if (utils.realStringLength(text) <= 0)
		{
			return;
		}

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		let params: any = {
			parentId,
			text: text,
			format: 'markdown',
		};

		if (parentType === 'board' || permissions.includes('edit'))
		{
			params.title = parentTitle;
		}

		await (await iso).query(null, 'v1/node/create', params);

		setLoading(false);
		setText('');
		setTextareaKey(Math.random());
	};

	// todo emote at end of textarea to open up emote picker

	if (liveMode)
	{
		return (
			<fieldset className='NodeWritingInterface NodeWritingInterface_live'>
				<div role='group'>
					{parentType === 'thread' &&
					<RequireClientJS>
						<div className='NodeWritingInterface_liveMode'>
							<Switch
								name='live'
								label='Live'
								variant='light'
								value={liveMode}
								clickHandler={setLiveMode}
								information='Live Mode allows you to see posts automatically as they come in.'
							/>
						</div>
					</RequireClientJS>
					}
				</div>

				<div role='group'>
					<RichTextArea
						key={textareaKey}
						textName='text'
						formatName='format'
						label={title}
						textValue={parentContent?.text}
						formatValue={parentContent ? parentContent.format : markupStyle}
						maxLength={[nodeParentId ?? 0, parentId].some((pid: number | undefined) => staffBoards.includes(utils.safeNumber(pid))) ? constants.max.staffPost : userDonations && userDonations.monthlyPerks >= 5 ? userDonations.monthlyPerks < 10 ? constants.max.post2 : constants.max.post3 : constants.max.post1}
						upload
						files={files}
						liveMode
						hideEmojis
						text={text}
						setText={setText}
						clickHandler={sendPost}
					/>

					<Button
						label='Submit'
						loading={loading}
						className='Form_button'
						clickHandler={sendPost}
					/>
				</div>
			</fieldset>
		);
	}

	return (
		<fieldset className='NodeWritingInterface' id='TextBox'>
			<Form action='v1/node/create' callback={callback} showButton formId={postId || String(parentId)} reload>
				<div role='group'>
					<h1 className='NodeWritingInterface_heading'>
						{title}
					</h1>

					{permissions.includes('lock') && parentType === 'thread' &&
						<div className='NodeWritingInterface_lock'>
							<Switch
								name='lock'
								label='Lock Thread'
								variant='light'
							/>
						</div>
					}

					{threadTypes.length > 1 &&
						<Select
							hideLabels
							name='type'
							options={threadTypes}
							label='Select thread type'
							value={threadType}
						/>
					}

					{parentType === 'thread' &&
						<RequireClientJS>
							<div className='NodeWritingInterface_liveMode'>
								<Switch
									name='live'
									label='Live'
									variant='light'
									value={liveMode}
									clickHandler={setLiveMode}
									information='Live Mode allows you to see posts automatically as they come in.'
								/>
							</div>
						</RequireClientJS>
					}
				</div>

				<input name='parentId' type='hidden' value={parentId} />

				{(parentType === 'board' || permissions.includes('edit')) &&
					<Text
						hideLabels
						className='NodeWritingInterface_title'
						name='title'
						label='Title'
						maxLength={constants.max.postTitle}
						required
						value={parentType === 'board' ? '' : parentTitle}
					/>
				}

				{boards.length > 0 && permissions.includes('move') && parentType === 'thread' &&
					<Select
						label='Move Thread'
						name='boardId'
						options={boards}
						optionsMapping={{ value: 'id', label: 'title' }}
						required
						value={nodeParentId}
					/>
				}

				{permissions.includes('add-users') &&
					<div className='NodeWritingInterface_usernames'>
						<Text
							name='addUsers'
							label='Add User(s)'
							maxLength={constants.max.addMultipleUsers}
							value={addUsers}
							information='Use to add users to the thread. You may add multiple users by separating their usernames with a comma. For example: jader201,aldericon'
						/>
					</div>
				}

				{permissions.includes('remove-users') &&
					<div className='NodeWritingInterface_usernames'>
						<Text
							name='removeUsers'
							label='Remove User(s)'
							maxLength={constants.max.addMultipleUsers}
							information='Use to remove users from the thread. You may add multiple users by separating their usernames with a comma. For example: jader201,aldericon'
						/>
					</div>
				}

				<RichTextArea
					textName='text'
					formatName='format'
					label={title}
					textValue={parentContent?.text}
					formatValue={parentContent ? parentContent.format : markupStyle}
					emojiSettings={emojiSettings}
					maxLength={[nodeParentId ?? 0, parentId].some((pid: number | undefined) => staffBoards.includes(utils.safeNumber(pid))) ? constants.max.staffPost : userDonations && userDonations.monthlyPerks >= 5 ? userDonations.monthlyPerks < 10 ? constants.max.post2 : constants.max.post3 : constants.max.post1}
					upload
					files={files}
					previewSignature
					text={text}
					setText={setText}
					maxImages={constants.max.imagesThread}
					pollMarkup
				/>
			</Form>
		</fieldset>
	);
};

type NodeWritingInterfaceProps = {
	parentId: number
	parentType: string // direct parent, the thread / board
	permissions: string[]
	lastPage?: number
	addUsers?: string
	nodeParentId?: number | null
	threadType?: string // the parent's parent, board of some type
	parentTitle?: string
	parentContent?: {
		text: string
		format: MarkupFormatType
	} | null
	threadId?: number
	emojiSettings?: EmojiSettingType[]
	markupStyle: MarkupStyleType
	files?: FileType[]
	staffBoards?: number[]
	boards?: NodeBoardType[]
	userDonations?: UserDonationsType
	liveMode: boolean
	setLiveMode: ClickHandlerType
	text: string,
	setText: (value: string) => void
};

export default NodeWritingInterface;
