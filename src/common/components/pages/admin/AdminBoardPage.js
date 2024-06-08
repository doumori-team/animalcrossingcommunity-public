import React, { useState } from 'react';
import { useLoaderData } from 'react-router-dom';

import { RequirePermission, RequireClientJS } from '@behavior';
import { Header, Section } from '@layout';
import { Form, Text, TextArea, Select, Check } from '@form';
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
	const [type, setType] = useState('public');

	const changeBoard = (value) =>
	{
		if (value === null)
		{
			setBoard(null);
			setParentBoardId(null);
			setTitle('');
			setDescription('');
			setType('public');
			return;
		}

		const boardId = Number(value);
		const foundBoard = boards.find(b => b.id === boardId);

		setBoard(foundBoard);
		setParentBoardId(foundBoard.parentId);
		setTitle(foundBoard.title);
		setDescription(foundBoard.content.text);
		setType(foundBoard.boardType);
		setParentKey(Math.random());
	}

	const changeParent = (value) =>
	{
		const boardId = Number(value);

		setParentBoardId(boardId);
	}

	// Need to update during off hours (maintenance mode) as needed:
	// - Materialized View: archived_threads (if any boards were archived)
	// - Indexes (if a board was made public / staff):
	//		- node_pni_tt_ltr_desc_include_public_no_type_board
	// 		- node_pni_tt_lrt_desc_include_public_locked_no_type_board
	// 		- node_pni_tt_lrt_desc_include_staff_type_no_type_board
	//		- node_pni_tt_lrt_desc_include_staff_locked_no_type_board
	return (
		<RequirePermission permission='board-admin'>
			<div className='AdminBoardPage'>
				<Header
					name='Board Admin'
					description="When changing the parent of a board, make sure to update the permissions if needed, as the board will then inherit from its parent(s). When adding a board, it will inherit the permissions of its parent(s). Note: Inform Developer Team Lead(s) of any changes made if making a new board or changing an existing board's type. If marking a board as archived, it will show as no threads until a developer updates the database."
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
									changeHandler={(e) => setTitle(e.target.value)}
								/>
							</Form.Group>
							<Form.Group>
								<TextArea
									name='description'
									label='Description'
									required
									maxLength={constants.max.boardDescription}
									value={description}
									changeHandler={(e) => setDescription(e.target.value)}
								/>
							</Form.Group>
							<Form.Group>
								<Check
									options={[{id: '', name: 'None'}].concat(constants.boardTypeOptions.map(t => {
										return {
											id: t,
											name: t
										};
									}))}
									name='type'
									defaultValue={type}
									label='Type'
									changeHandler={(e) => setType(e.target.value)}
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
