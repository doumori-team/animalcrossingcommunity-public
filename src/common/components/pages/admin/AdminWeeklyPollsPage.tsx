import React from 'react';
import { Link, useLoaderData } from 'react-router-dom';

import { RequirePermission } from '@behavior';
import NavMenu from '@/components/layout/NavMenu.js';
import { Pagination, Markup, Header, Section } from '@layout';
import { dateUtils, constants } from '@utils';
import { Confirm } from '@form';
import { APIThisType, PollsType } from '@types';

const AdminWeeklyPollsPage = () =>
{
	const { polls, totalCount, page, pageSize, type } = useLoaderData() as AdminWeeklyPollsPageProps;

	return (
		<div className='AdminWeeklyPollsPage'>
			<RequirePermission permission='polls-admin'>
				<Header
					name='Weekly Polls'
					links={
						<Link to={`/admin/weekly-poll/add`}>
							Add New Poll
						</Link>
					}
				>
					<NavMenu>
						<NavMenu.Button path={`/admin/weekly-polls`} index>
							Upcoming
						</NavMenu.Button>
						<NavMenu.Button path={`/admin/weekly-polls/${constants.pollTypes.previous}`}>
							Previous Polls
						</NavMenu.Button>
					</NavMenu>
				</Header>

				<Section>
					{polls.map(poll =>
					{
						const status = !poll.isEnabled ? 'disabled' :
							dateUtils.isAfterCurrentDateTimezone(poll.startDate) ? constants.pollTypes.upcoming :
								dateUtils.isBeforeCurrentDateTimezone(poll.endDate) ? constants.pollTypes.previous :
									'current';
						const totalVotes = poll.options.reduce((acc, cur) =>
						{
							return acc + cur.votes;
						}, 0);

						return (
							<div key={poll.id} className={`PollAdmin_section PollAdmin_section-${status}`}>
								<div className='PollQuestion'>
									<em>
										{poll.question}
									</em>

									{status !== constants.pollTypes.previous &&
										<div className='PollQuestion_links'>
											<Link to={`/admin/weekly-poll/${encodeURIComponent(poll.id)}/edit`}>
												Edit
											</Link>
											<Confirm
												action='v1/admin/poll/destroy'
												callback='/admin/weekly-polls'
												label='Delete'
												message='Are you sure you want to delete this poll?'
												id={poll.id}
											/>
										</div>
									}
								</div>

								{poll.description &&
									<Markup
										text={poll.description}
										format={'markdown'}
									/>
								}

								<div className='PollSettings'>
									<ul>
										<li>
											<strong>Scheduled Date:</strong>
											{' '}{dateUtils.formatDateTime3(poll.startDate)}
											{' '}- {dateUtils.formatDateTime3(poll.endDate)}
										</li>
										<li>
											<strong>Multiple Choice:</strong>
											{' '}{poll.isMultipleChoice ? 'Yes' : 'No'}
										</li>
										<li>
											<strong>Total Votes:</strong>
											{' '}{poll.options.reduce((acc, cur) =>
											{
												return acc + cur.votes;
											}, 0)}
										</li>
										<li>
											<strong>Options:</strong>
											{poll.options.map((option, index) =>
											{
												const proportion = totalVotes > 0 ? option.votes / totalVotes : 0;

												return (
													<div key={index}>
														<span>Option #{index + 1}: {option.description} (Votes: {(proportion * 100).toFixed(1)}% ({option.votes}))</span>
													</div>
												);
											})}
										</li>
									</ul>
								</div>
							</div>
						);
					})}

					{polls.length === 0 &&
						'No polls found.'
					}

					<Pagination
						page={page}
						pageSize={pageSize}
						totalCount={totalCount}
						startLink={type === constants.pollTypes.previous ? `admin/weekly-polls/${constants.pollTypes.previous}` : `admin/weekly-polls`}
					/>
				</Section>
			</RequirePermission>
		</div>
	);
};

export async function loadData(this: APIThisType, { type }: { type: string }, { page }: { page?: string }): Promise<AdminWeeklyPollsPageProps>
{
	const [polls] = await Promise.all([
		this.query('v1/admin/polls', {
			page: page ? page : 1,
			type: type ? type : constants.pollTypes.upcoming,
		}),
	]);

	return {
		polls: polls.results,
		totalCount: polls.count,
		page: polls.page,
		pageSize: polls.pageSize,
		type,
	};
}

type AdminWeeklyPollsPageProps = {
	polls: PollsType['results']
	totalCount: PollsType['count']
	page: PollsType['page']
	pageSize: PollsType['pageSize']
	type: string
};

export default AdminWeeklyPollsPage;
