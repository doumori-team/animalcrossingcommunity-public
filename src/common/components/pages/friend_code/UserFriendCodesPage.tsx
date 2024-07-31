import React from 'react';
import { useLoaderData } from 'react-router-dom';

import { RequireUser } from '@behavior';
import { Form, Check, Text } from '@form';
import FriendCode from '@/components/friend_codes/FriendCode.tsx';
import { constants } from '@utils';
import { Pagination, Section, Grid, InnerSection } from '@layout';
import { APIThisType, UserFriendCodesType, RatingType } from '@types';

const UserFriendCodesPage = () =>
{
	const {userId, friendCodes, rating, haveWhitelisted, page, pageSize,
		totalCount} = useLoaderData() as UserFriendCodesPageProps;

	const encodedId = encodeURIComponent(userId);

	const showRatings = Object.keys(constants.rating.configs)
		.map(x => {
			return {
				id: (constants.rating.configs as any)[x].id,
				filename: (constants.rating.configs as any)[x].image,
			};
		});

	return (
		<div className='UserFriendCodesPage'>
			<RequireUser permission='use-friend-codes'>
				{rating && (
					<Section>
						<h2>Update Wifi Rating</h2>
						<Form
							action='v1/rating/save'
							callback={`/ratings/${encodedId}/${constants.rating.types.wifi}`}
							className='UserFriendCodesPage_rating'
							showButton
						>
							<input type='hidden' name='userId' value={userId} />
							<input type='hidden' name='id' value={rating ? rating.id : 0} />

							<div className='UserFriendCodesPage_ratingOptions'>
								<Form.Group>
									<Check
										options={showRatings}
										name={`rating`}
										defaultValue={rating ? [rating.rating] : []}
										required
										imageLocation='rating'
										useImageFilename
										hideName
										label='Rating'
									/>
								</Form.Group>

								<Form.Group>
									<Text
										name='comment'
										label='Comment'
										value={rating ? rating.comment : ''}
										required
										maxLength={constants.max.comment}
									/>
								</Form.Group>
							</div>
						</Form>
					</Section>
				)}

				<Section>
					<Grid options={friendCodes} message={
						!haveWhitelisted ? (
							<Form
								action='v1/rating/whitelist/save'
								callback={`/profile/${encodedId}/friend-codes`}
								showButton
								buttonText='Show Friend Codes'
							>
								<input type='hidden' name='whitelistUserId' value={userId} />
							</Form>
						) : (
							'No friend codes available.'
						)
					}>
						{friendCodes.map(fc =>
							<InnerSection key={fc.id}>
								<FriendCode
									friendCode={fc}
								/>
							</InnerSection>
						)}
					</Grid>

					<Pagination
						page={page}
						pageSize={pageSize}
						totalCount={totalCount}
						startLink={`profile/${encodedId}/friend-codes`}
					/>
				</Section>
			</RequireUser>
		</div>
	);
}

export async function loadData(this: APIThisType, {id}: {id: string}, {page}: {page?: string}) : Promise<UserFriendCodesPageProps>
{
	const userId = Number(id);

	const [fcObj, rating, haveWhitelisted] = await Promise.all([
		this.query('v1/users/friend_codes', {id: id, page: page ? page : 1}),
		this.query('v1/users/wifi_rating', {id: id}),
		this.query('v1/rating/whitelist/have_whitelisted', {id: id}),
	]);

	return {
		userId,
		friendCodes: fcObj.results,
		rating,
		haveWhitelisted,
		totalCount: fcObj.count,
		page: fcObj.page,
		pageSize: fcObj.pageSize
	};
}

type UserFriendCodesPageProps = {
	userId: number
	friendCodes: UserFriendCodesType['results']
	rating: RatingType|null
	haveWhitelisted: boolean
	totalCount: UserFriendCodesType['count']
	page: UserFriendCodesType['page']
	pageSize: UserFriendCodesType['pageSize']
}

export default UserFriendCodesPage;
