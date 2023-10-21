import React from 'react';
import { Link, useLoaderData } from 'react-router-dom';

import { RequirePermission, RequireGroup } from '@behavior';
import { constants, utils } from '@utils';
import { Form, Select, Check, Text } from '@form';
import { Header, Pagination, Search, Section, Grid } from '@layout';
import { UserContext } from '@contexts';

const ScoutHubPage = () =>
{
	const {threads, page, pageSize, totalCount, scouts, scoutIds, adoptee,
		newMembers, locked} = useLoaderData();

	const link = `&scoutIds=${encodeURIComponent(scoutIds)}
		&adoptee=${encodeURIComponent(adoptee)}
		&newMembers=${encodeURIComponent(newMembers)}
		&locked=${encodeURIComponent(locked)}
	`;

	return (
		<div className='ScoutHubPage'>
			<RequirePermission permission='scout-pages'>
				<Header
					name='Scout Hub'
					links={
						<>
						<Link to={`/scout-hub/new-members`}>New Members</Link>
						<RequireGroup group={constants.staffIdentifiers.scout} silent>
							<Link to={`/scout-hub/settings`}>Settings</Link>
							<UserContext.Consumer>
								{scout => scout && (
									<Link to={`/scout-hub/ratings/${encodeURIComponent(scout.id)}`}>
										Feedback
									</Link>
								)}
							</UserContext.Consumer>
						</RequireGroup>
						<Link to={`/scout-hub/adoption/${encodeURIComponent(constants.boardIds.adopteeBT)}`}>
							Adoptee BT
						</Link>
						<RequirePermission permission='adoption-bt-settings' silent>
							<Link to={`/scout-hub/adoption/settings`}>
								Adoptee BT Settings
							</Link>
						</RequirePermission>
						</>
					}
				/>

				<Search callback='/scout-hub'>
					<Form.Group>
						<Text
							name='adoptee'
							label='Adoptee'
							value={adoptee}
							maxLength={constants.max.searchUsername}
						/>
					</Form.Group>
					<Form.Group>
						<Select
							name='scoutIds'
							multiple
							value={scoutIds}
							options={scouts}
							optionsMapping={{value: 'id', label: 'username'}}
							placeholder='Choose Scout(s)...'
							size={5}
							label='Scout(s)'
						/>
					</Form.Group>
					<Form.Group>
						<Check
							options={constants.boolOptions}
							name='newMembers'
							defaultValue={utils.realStringLength(newMembers) > 0 ?
								[newMembers] : ['yes']}
							label='New Members'
						/>
					</Form.Group>
					<Form.Group>
						<Check
							options={constants.boolOptions}
							name='locked'
							defaultValue={utils.realStringLength(locked) > 0 ?
								[locked] : ['false']}
							label='Closed'
						/>
					</Form.Group>
				</Search>

				<Section>
					<Grid name='thread' options={threads}>
						{threads.map((thread, index) =>
							<div key={index} className='ScoutHubPage_thread'>
								{(thread.id && thread.hasPermission) && (
									<div className='ScoutHubPage_threadId'>
										<Link to={`/scout-hub/adoption/${thread.id}`}>
											#{thread.id}
										</Link>
									</div>
								)}

								<div className='ScoutHubPage_scout'>
									Scout: <Link to={`/profile/${encodeURIComponent(thread.scoutId)}`}>
										{thread.scoutUsername}
									</Link>
								</div>

								<div className='ScoutHubPage_adoptee'>
									Adoptee: <Link to={`/profile/${encodeURIComponent(thread.adopteeId)}`}>
										{thread.adopteeUsername}
									</Link>
								</div>

								<div className='ScoutHubPage_adopted'>
									Adopted: {thread.adopted}
								</div>

								{thread.last_updated && (
									<div className='ScoutHubPage_lastUpdated'>
										Last Updated: {thread.lastUpdated}
									</div>
								)}
							</div>
						)}
					</Grid>

					<Pagination
						page={page}
						pageSize={pageSize}
						totalCount={totalCount}
						startLink={`scout-hub`}
						endLink={link}
					/>
				</Section>
			</RequirePermission>
		</div>
	);
}

export async function loadData(_, {page, scoutIds, adoptee, newMembers, locked})
{
	const [result] = await Promise.all([
		this.query('v1/scout_hub/threads', {
			page: page ? page : 1,
			scoutIds: scoutIds ? scoutIds : '',
			adoptee: adoptee ? adoptee : '',
			newMembers: newMembers ? newMembers : 'yes',
			locked: locked ? locked : 'no',
		}),
	]);

	return {
		threads: result.threads,
		totalCount: result.count,
		page: result.page,
		pageSize: result.pageSize,
		scouts: result.scouts,
		scoutIds: result.scoutIds,
		adoptee: result.adoptee,
		newMembers: result.newMembers,
		locked: result.locked,
	};
}

export default ScoutHubPage;
