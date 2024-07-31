import React from 'react';
import { Link, useLoaderData } from 'react-router-dom';

import { RequireUser } from '@behavior';
import { Header, Section, Grid, Pagination, InnerSection, SelectAllCheckbox } from '@layout';
import { Form, Checkbox } from '@form';
import { APIThisType, UserNotificationsType } from '@types';

const NotificationsPage = () =>
{
	const {userNotifications, globalNotifications, page, pageSize,
		userTotalCount, globalTotalCount, sortBy} = useLoaderData() as NotificationsPageProps;

	return (
		<RequireUser>
			<div className='NotificationsPage'>
				<Header
					name='Notifications'
				/>

				<Section>
					<Grid name='global notification' options={globalNotifications}>
						{globalNotifications.map(notification =>
							<InnerSection key={notification.id}>
								<div className='NotificationsPage_notificationDescription'>
									<Link
										to={notification.url}
										reloadDocument={notification.anchor ? true : false}
									>
										{notification.description}
									</Link>
								</div>

								<div className='NotificationsPage_notificationCreated'>
									Created: {notification.formattedCreated}
								</div>

								<div className='NotificationsPage_notificationNotified'>
									Notified: {notification.formattedNotified}
								</div>
							</InnerSection>
						)}
					</Grid>

					<Pagination
						page={page}
						pageSize={pageSize}
						totalCount={globalTotalCount}
						startLink='notifications'
					/>
				</Section>

				<Section>
					{userNotifications.length > 0 ? (
						<>
						<div className='NotificationsPage_sort'>
							<h3>Sort by:</h3>
							<Link
								className={sortBy === 'category' ? 'NotificationsPage_sortLink selected' : 'NotificationsPage_sortLink'}
								to={`/notifications?sort=category`}>
								Category
							</Link>
							{' | '}
							<Link
								className={!sortBy || sortBy === 'notified' ? 'NotificationsPage_sortLink selected' : 'NotificationsPage_sortLink'}
								to={`/notifications?sort=notified`}>
								Notified
							</Link>
						</div>

						<SelectAllCheckbox
							name='toggle_buddyUsers'
							select='.Grid input[name="notificationIds"]'
						/>

						<Form
							action='v1/notification/clear'
							showButton
							buttonText='Remove Selected Notifications'
						>
							<div className='Grid'>
								{userNotifications.map(notification =>
									<InnerSection key={notification.id}>
										<Form.Group>
											<Checkbox
												name='notificationIds'
												label='Remove Notification'
												value={notification.id}
												hideLabel
											/>
										</Form.Group>

										<div className='NotificationsPage_notificationDescription'>
											<Link
												to={notification.url}
												reloadDocument={notification.anchor ? true : false}
											>
												{notification.description}
											</Link>
										</div>

										<div className='NotificationsPage_notificationCreated'>
											Created: {notification.formattedCreated}
										</div>

										<div className='NotificationsPage_notificationNotified'>
											Notified: {notification.formattedNotified}
										</div>
									</InnerSection>
								)}
							</div>
						</Form>
						</>
					) : (
						'You have no notifications.'
					)}

					<Pagination
						page={page}
						pageSize={pageSize}
						totalCount={userTotalCount}
						startLink='notifications'
					/>
				</Section>
			</div>
		</RequireUser>
	);
}

export async function loadData(this: APIThisType, _: any, {page, sort}: {page?: string, sort?: string}) : Promise<NotificationsPageProps>
{
	const sortBy = sort ? sort : '';

	const [returnValue] = await Promise.all([
		this.query('v1/users/notifications', {
			page: page ? page : 1,
			sort: sortBy,
		}),
	]);

	return {
		userNotifications: returnValue.userNotifications,
		globalNotifications: returnValue.globalNotifications,
		page: returnValue.page,
		pageSize: returnValue.pageSize,
		userTotalCount: returnValue.userTotalCount,
		globalTotalCount: returnValue.globalTotalCount,
		sortBy,
	};
}

type NotificationsPageProps = {
	userNotifications: UserNotificationsType['userNotifications']
	globalNotifications: UserNotificationsType['globalNotifications']
	page: UserNotificationsType['page']
	pageSize: UserNotificationsType['pageSize']
	userTotalCount: UserNotificationsType['userTotalCount']
	globalTotalCount: UserNotificationsType['globalTotalCount']
	sortBy: string
}

export default NotificationsPage;
