import React from 'react';
import { useAsyncValue } from 'react-router-dom';

import { RequireUser } from '@behavior';
import Node from '@/components/nodes/Node.js';
import { Header, Section, Grid, Pagination } from '@layout';

const FollowedNodePage = () =>
{
	const {nodes, type, page, pageSize, totalCount} = getData(useAsyncValue());

	return (
		<RequireUser>
			<div className='FollowedNodePage'>
				<Header name={`Followed ${type}s`} />
				<Section>
					<Grid
						options={nodes}
						message='Nothing is currently being followed.'
					>
						{nodes.map(node =>
							<Node {...node} key={node.id} followNode={true} />
						)}
					</Grid>

					<Pagination
						page={page}
						pageSize={pageSize}
						totalCount={totalCount}
						startLink={`followed/${encodeURIComponent(type)}`}
					/>
				</Section>
			</div>
		</RequireUser>
	);
}

export async function loadData({type}, {page})
{
	return Promise.all([
		this.query('v1/node/followed', {type: type, page: page ? page : 1}),
	]);
}

function getData(data)
{
	const [returnValue] = data;

	return {
		type: returnValue.type,
		nodes: returnValue.results,
		page: returnValue.page,
		pageSize: returnValue.pageSize,
		totalCount: returnValue.totalCount,
	};
}

export default FollowedNodePage;
