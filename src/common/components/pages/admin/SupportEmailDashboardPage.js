import React from 'react';
import { Link, useLoaderData } from 'react-router-dom';

import { RequirePermission, RequireTestSite } from '@behavior';
import { Form, Text, Check, Confirm } from '@form';
import { Pagination, Header, Search, Section, Grid } from '@layout';
import { utils, constants, dateUtils } from '@utils';

const SupportEmailDashboardPage = () =>
{
	const {totalCount, supportEmails, page, pageSize, fromUser, fromEmail,
		toUser, toEmail, startDate, endDate, read, forUser} = useLoaderData();

	const link = `&fromUser=${encodeURIComponent(fromUser)}
		&fromEmail=${encodeURIComponent(fromEmail)}
		&toUser=${encodeURIComponent(toUser)}
		&toEmail=${encodeURIComponent(toEmail)}
		&startDate=${encodeURIComponent(startDate)}
		&endDate=${encodeURIComponent(endDate)}
		&read=${encodeURIComponent(read)}
		&forUser=${encodeURIComponent(forUser)}
	`;

	return (
		<div className='SupportEmailDashboardPage'>
			<RequirePermission permission='process-user-tickets'>
				<Header
					name='Support Email Dashboard'
					links={
						<>
						<Link to={`/support-emails/send`}>
							Send New Email
						</Link>
						<RequireTestSite>
							<Confirm
								action='v1/support_email/fetch'
								callback='/support-emails'
								label='Fetch'
								message='This will fetch all unread messages. Once clicked, give it a minute before trying a new search for it to complete the process.'
							/>
						</RequireTestSite>
						</>
					}
				/>

				<Search callback='/support-emails'>
					<Form.Group>
						<Text
							label='From User'
							name='fromUser'
							value={fromUser}
							maxLength={constants.max.searchUsername}
						/>
					</Form.Group>
					<Form.Group>
						<Text
							type='email'
							name='fromEmail'
							value={fromEmail}
							label='From Email'
							pattern={constants.regexes.email}
						/>
					</Form.Group>
					<Form.Group>
						<Text
							label='To User'
							name='toUser'
							value={toUser}
							maxLength={constants.max.searchUsername}
						/>
					</Form.Group>
					<Form.Group>
						<Text
							type='email'
							name='toEmail'
							value={toEmail}
							label='To Email'
							pattern={constants.regexes.email}
						/>
					</Form.Group>
					<Form.Group>
						<Text
							label='For User'
							name='forUser'
							value={forUser}
							maxLength={constants.max.searchUsername}
						/>
					</Form.Group>
					<Form.Group>
						<Text
							type='date'
							name='startDate'
							label='Start Date'
							value={startDate}
							min='2002-10-28'
						/>
					</Form.Group>
					<Form.Group>
						<Text
							type='date'
							name='endDate'
							label='End Date'
							value={endDate}
							max={dateUtils.formatCurrentDateYearMonthDay()}
						/>
					</Form.Group>
					<Form.Group>
						<Check
							label='Read'
							options={constants.boolOptions}
							name='read'
							defaultValue={utils.realStringLength(read) > 0 ?
								[read] : ['both']}
						/>
					</Form.Group>
				</Search>

				<Section>
					<Grid name='support email' options={supportEmails}>
						{supportEmails.map((supportEmail, index) =>
							<div className='SupportEmailDashboardPage_supportEmail' key={index}>
								<div className='SupportEmailDashboardPage_supportEmailId'>
									ID: <Link to={`/support-email/${encodeURIComponent(supportEmail.id)}`}>
										{supportEmail.id}
									</Link>
								</div>

								{supportEmail.fromUser && (
									<div className='SupportEmailDashboardPage_fromUser'>
										From: {supportEmail.fromUser.id && (
											<Link to={`/profile/${encodeURIComponent(supportEmail.fromUser.id)}`}>
												{supportEmail.fromUser.username}
											</Link>
										)} {supportEmail.fromUser.email && `<${supportEmail.fromUser.email}>`}
									</div>
								)}

								{supportEmail.toUser && (
									<div className='SupportEmailDashboardPage_toUser'>
										To: {supportEmail.toUser.id && (
											<Link to={`/profile/${encodeURIComponent(supportEmail.toUser.id)}`}>
												{supportEmail.toUser.username}
											</Link>
										)} {supportEmail.toUser.email && `<${supportEmail.toUser.email}>`}
									</div>
								)}

								<div className='SupportEmailDashboardPage_subject'>
									Subject: {supportEmail.subject}
								</div>

								<div className='SupportEmailDashboardPage_date'>
									Date: {supportEmail.formattedRecorded}
								</div>

								<div className='SupportEmailDashboardPage_read'>
									Read: {supportEmail.read ? 'Yes' : 'No'}
								</div>
							</div>
						)}
					</Grid>

					<Pagination
						page={page}
						pageSize={pageSize}
						totalCount={totalCount}
						startLink={`support-emails`}
						endLink={link}
					/>
				</Section>
			</RequirePermission>
		</div>
	);
}

export async function loadData(_, query)
{
	const {page, fromUser, fromEmail, toUser, toEmail, startDate, endDate, read, forUser} = query;

	const [returnValue] = await Promise.all([
		this.query('v1/support_emails', {
			page: page ? page : 1,
			fromUser: fromUser ? fromUser : '',
			fromEmail: fromEmail ? fromEmail : '',
			toUser: toUser ? toUser : '',
			toEmail: toEmail ? toEmail : '',
			startDate: startDate ? startDate : '',
			endDate: endDate ? endDate : '',
			read: read ? read : 'no',
			forUser: forUser ? forUser : '',
		}),
	]);

	return {
		supportEmails: returnValue.results,
		totalCount: returnValue.count,
		page: returnValue.page,
		pageSize: returnValue.pageSize,
		fromUser: returnValue.fromUser,
		fromEmail: returnValue.fromEmail,
		toUser: returnValue.toUser,
		toEmail: returnValue.toEmail,
		startDate: returnValue.startDate,
		endDate: returnValue.endDate,
		read: returnValue.read,
		forUser: returnValue.forUser,
	};
}

export default SupportEmailDashboardPage;
