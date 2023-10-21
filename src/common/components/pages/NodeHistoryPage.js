import React from 'react';
import { Link, useLoaderData } from 'react-router-dom';

import { RequirePermission } from '@behavior';
import { Header, Section, Grid, Markup, PhotoGallery } from '@layout';

const NodeHistoryPage = () =>
{
	const {parentNode, nodes, nodeEmojiSettings} = useLoaderData();

	return (
		<div className='NodeHistoryPage'>
			<RequirePermission permission='view-edit-history'>
				<Header
					name={`Post History #${parentNode.id}`}
					links={
						<Link to={`/forums/${encodeURIComponent(parentNode.parentId)}`}>
							Return to Thread
						</Link>
					}
				/>

				<Section>
					<Grid name='changes' options={nodes}>
						{nodes.map((node, index) =>
							<div className='NodeHistoryPage_node' key={index}>
								<div className='NodeHistoryPage_date'>
									Date: {node.formattedDate}
								</div>

								<div className='NodeHistoryPage_user'>
									User: <Link to={`/profile/${encodeURIComponent(node.user.id)}`}>
										{node.user.username}
									</Link>
								</div>

								{node.title && (
									<div className='NodeHistoryPage_title'>
										Title: {node.title}
									</div>
								)}

								{(node.content && node.content.text) && (
									<div className='NodeHistoryPage_content'>
										Content:
										<Markup
											text={node.content.text}
											format={node.content ?
												node.content.format :
												'markdown'}
											emojiSettings={nodeEmojiSettings}
										/>
									</div>
								)}

								{node.files && (
									<PhotoGallery
										userId={node.user.id}
										files={node.files}
									/>
								)}
							</div>
						)}
					</Grid>
				</Section>
			</RequirePermission>
		</div>
	);
}

export async function loadData({id})
{
	const [parentNode, nodes] = await Promise.all([
		this.query('v1/node/lite', {id: id}),
		this.query('v1/node/history', {id: id}),
	]);

	const [nodeEmojiSettings] = await Promise.all([
		this.query('v1/settings/emoji', {userIds: [nodes[0].user.id]}),
	]);

	return {parentNode, nodes, nodeEmojiSettings};
}

export default NodeHistoryPage;
