import React, { useState } from 'react';
import { Link, useLoaderData } from 'react-router-dom';

import { RequirePermission, RequireClientJS } from '@behavior';
import { Header, Section } from '@layout';
import { Form, Text, TextArea, Select } from '@form';
import { constants } from '@utils';
import { ErrorMessage } from '@layout';

const AdminBoardPage = () =>
{
	const {boards} = useLoaderData();
	const [board, setBoard] = useState(null);
	const [parentBoardId, setParentBoardId] = useState(null);
	const [title, setTitle] = useState('');
	const [description, setDescription] = useState('');
	const [parentKey, setParentKey] = useState(Math.random());

	const changeBoard = (value) =>
	{
		if (value === null)
		{
			setBoard(null);
			setParentBoardId(null);
			setTitle('');
			setDescription('');
			return;
		}

		const boardId = Number(value);
		const foundBoard = boards.find(b => b.id === boardId);

		setBoard(foundBoard);
		setParentBoardId(foundBoard.parentId);
		setTitle(foundBoard.title);
		setDescription(foundBoard.content.text);
		setParentKey(Math.random());
	}

	const changeParent = (value) =>
	{
		const boardId = Number(value);

		setParentBoardId(boardId);
	}

	const changeTitle = (e) =>
	{
		setTitle(e.target.value);
	}

	const changeDescription = (e) =>
	{
		setDescription(e.target.value);
	}

	return (
		<RequirePermission permission='board-admin'>
			<div className='AdminBoardPage'>
				<Header
					name='Board Admin'
					description='When changing the parent of a board, make sure to update the permissions if needed, as the board will then inherit from its parent(s). When adding a board, it will inherit the permissions of its parent(s).'
				/>

				<Section>
					<RequireClientJS fallback={
						<ErrorMessage identifier='javascript-required' />
					}>
						<Form action='v1/admin/board/save' showButton>
							<Form.Group>
								<Select
									name='boardId'
									label='Board'
									options={[{id: null, title: 'New Board'}].concat(boards)}
									optionsMapping={{value: 'id', label: 'title'}}
									changeHandler={changeBoard}
									useReactSelect
								/>
							</Form.Group>
							<Form.Group>
								<Select
									name='parentId'
									label='Parent Board'
									options={boards}
									optionsMapping={{value: 'id', label: 'title'}}
									value={parentBoardId}
									changeHandler={changeParent}
									useReactSelect
									key={parentKey}
								/>
							</Form.Group>
							<Form.Group>
								<Text
									name='title'
									label='Title'
									required
									maxLength={constants.max.boardTitle}
									value={title}
									changeHandler={changeTitle}
								/>
							</Form.Group>
							<Form.Group>
								<TextArea
									name='description'
									label='Description'
									required
									maxLength={constants.max.boardDescription}
									value={description}
									changeHandler={changeDescription}
								/>
							</Form.Group>
						</Form>
					</RequireClientJS>
				</Section>
			</div>
		</RequirePermission>
	);
}

export async function loadData()
{
	const [boards] = await Promise.all([
		this.query('v1/node/boards'),
	]);

	return {boards};
}

export default AdminBoardPage;
