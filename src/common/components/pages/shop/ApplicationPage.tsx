import React from 'react';
import { Link, useLoaderData } from 'react-router-dom';

import { RequirePermission } from '@behavior';
import { Form, RichTextArea, Text, Confirm } from '@form';
import { Header, Section, Markup, ReportProblem } from '@layout';
import { constants } from '@utils';
import TotalRatings from '@/components/ratings/TotalRatings.tsx';
import StatusIndicator from '@/components/nodes/StatusIndicator.tsx';
import { APIThisType, ThreadApplicationType, EmojiSettingType, MarkupStyleType } from '@types';

const ApplicationPage = () =>
{
	const { application, userEmojiSettings, markupStyle } = useLoaderData() as ApplicationPageProps;

	return (
		<div className='ApplicationPage'>
			<RequirePermission permission='modify-shops'>
				<Header
					name={`Applications: ${application.user.username}`}
					links={
						<>
							<Link to='/shops'>
								Shops
							</Link>
							<Link to='/shops/threads'>
								Threads
							</Link>
						</>
					}
				/>

				<Section>
					<div className='ThreadsPage_applicationLinks'>
						<Confirm
							action='v1/shop/waitlist'
							callback='/shops/threads'
							id={application.id}
							label='Waitlist'
							message='Are you sure you want to waitlist this application?'
						/>
					</div>

					<ReportProblem type={constants.userTicket.types.shopApplication} id={application.id} />
					<Markup
						text={application.application.content}
						format={application.application.format}
						emojiSettings={application.emojiSettings}
					/>

					<div>
						Last Active: <StatusIndicator lastActiveTime={application.user.lastActiveTime} showDate />
					</div>

					<div>
						Days Active in Last 30 Days: {application.user.active30Days}
					</div>

					<TotalRatings
						positiveRatingsTotal={application.user.positiveWifiRatingsTotal}
						neutralRatingsTotal={application.user.neutralWifiRatingsTotal}
						negativeRatingsTotal={application.user.negativeWifiRatingsTotal}
						type={constants.rating.types.wifi}
					/>
					<TotalRatings
						positiveRatingsTotal={application.user.positiveTradeRatingsTotal}
						neutralRatingsTotal={application.user.neutralTradeRatingsTotal}
						negativeRatingsTotal={application.user.negativeTradeRatingsTotal}
						type={constants.rating.types.trade}
					/>
					<TotalRatings
						positiveRatingsTotal={application.user.positiveShopRatingsTotal}
						neutralRatingsTotal={application.user.neutralShopRatingsTotal}
						negativeRatingsTotal={application.user.negativeShopRatingsTotal}
						type={constants.rating.types.shop}
					/>
				</Section>

				<fieldset className='NodeWritingInterface'>
					<Form action='v1/shop/node/create' callback='/shops/threads/:id' showButton>
						<div role='group'>
							<h1 className='NodeWritingInterface_heading'>
								Create Application Thread
							</h1>
						</div>

						<input name='applicationId' type='hidden' value={application.id} />

						<Text
							hideLabel
							className='NodeWritingInterface_title'
							name='title'
							label='Title'
							maxLength={constants.max.postTitle}
							required
						/>

						<div className='NodeWritingInterface_usernames'>
							<Text
								name='users'
								label='Username(s)'
								maxLength={constants.max.addMultipleUsers}
							/>
						</div>

						<RichTextArea
							textName='text'
							formatName='format'
							key={Math.random()}
							label='Create Application Thread'
							emojiSettings={userEmojiSettings}
							formatValue={markupStyle ? markupStyle : 'markdown'}
							maxLength={constants.max.post1}
							required
						/>
					</Form>
				</fieldset>
			</RequirePermission>
		</div>
	);
};

export async function loadData(this: APIThisType, { id }: { id: string }): Promise<ApplicationPageProps>
{
	const [application, userEmojiSettings, forumSettings] = await Promise.all([
		this.query('v1/shop/thread', { id: id, category: constants.shops.categories.applications }),
		this.query('v1/settings/emoji'),
		this.query('v1/settings/forum'),
	]);

	return {
		application,
		userEmojiSettings,
		markupStyle: forumSettings.markupStyle,
	};
}

type ApplicationPageProps = {
	application: ThreadApplicationType
	userEmojiSettings: EmojiSettingType[]
	markupStyle: MarkupStyleType
};

export default ApplicationPage;
