import React from 'react';
import { Link, useLoaderData } from 'react-router-dom';

import { RequireUser, RequireTestSite, RequirePermission } from '@behavior';
import { Form, Check, Confirm, Select, Text, TextArea, RichTextArea } from '@form';
import { constants } from '@utils';
import Listing from '@/components/trading_post/Listing.tsx';
import Offer from '@/components/trading_post/Offer.tsx';
import Rating from '@/components/ratings/Rating.tsx';
import { UserContext } from '@contexts';
import { Keyboard, Header, Section, ReportProblem, Markup, ErrorMessage } from '@layout';
import {
	APIThisType,
	ListingType,
	CharacterType,
	TownType,
	EmojiSettingType,
	GamesType,
	UserFriendCodesType,
} from '@types';

const ListingPage = () =>
{
	const { listing, characters, game, towns, friendCodes, userEmojiSettings,
		currentUserEmojiSettings } = useLoaderData() as ListingPageProps;

	const encodedId = encodeURIComponent(listing.id);

	let filteredCharacters = characters
		.filter(c => listing.game ? c.game.id === listing.game.id : c);

	if (listing.game && listing.game.id > constants.gameIds.ACGC && game)
	{
		const friendCodeCharacterIds = friendCodes
			.filter(fc => fc.character && fc.character.game.id === game.id)
			.map(fc => fc.character.id);

		filteredCharacters = characters
			.filter(c => friendCodeCharacterIds.includes(c.id));
	}

	const showRatings = Object.keys(constants.rating.configs)
		.map(x =>
		{
			return {
				id: (constants.rating.configs as any)[x].id,
				filename: (constants.rating.configs as any)[x].image,
			};
		});

	return (
		<div className='ListingPage'>
			<RequirePermission permission='use-trading-post'>
				<Header
					name={`Listing #${listing.id}`}
					links={
						<RequireUser silent>
							<Link to={`/trading-post/add`}>
								Create a Listing
							</Link>
							<UserContext.Consumer>
								{currentUser => currentUser &&
									<>
										<Link to={`/trading-post/${encodeURIComponent(currentUser.id)}/all`}>
											My Trades
										</Link>
										<Link to={`/ratings/${encodeURIComponent(currentUser.id)}/${constants.rating.types.trade}`}>
											My Trade Ratings
										</Link>
										<Link to={`/catalog/${encodeURIComponent(currentUser.id)}`}>
											My Catalog
										</Link>
									</>
								}
							</UserContext.Consumer>
						</RequireUser>
					}
				/>

				<Section>
					{!listing.game &&
						<RequireTestSite>
							<ErrorMessage identifier='test-account-required' />
						</RequireTestSite>
					}

					<Listing listing={listing} />
				</Section>

				<div className='ListingPage_offers'>
					{listing.offers.total > 0 ?
						<div className='Grid'>
							{listing.offers.accepted &&
								<Offer
									offer={listing.offers.accepted}
									listing={listing}
								/>
							}

							{listing.offers.list.map(offer =>
								<Offer
									key={offer.id}
									offer={offer}
									listing={listing}
								/>,
							)}
						</div>
						:
						'No offers made.'
					}
				</div>

				<UserContext.Consumer>
					{currentUser => (currentUser?.id === listing.creator.id ||
						currentUser?.id === listing.offers.accepted?.user.id) &&
						<>
							{(listing.status === constants.tradingPost.listingStatuses.offerAccepted ||
								listing.status === constants.tradingPost.listingStatuses.inProgress) && (
								listing.game ?
									<Form action='v1/trading_post/listing/code'
										callback={`/trading-post/${encodedId}`}
										className='ListingPage_code'
										showButton={listing.game.id === constants.gameIds.ACGC && filteredCharacters.length > 0 || listing.game.id !== constants.gameIds.ACGC}
									>
										<input type='hidden' name='id' value={listing.id} />

										<div className='ListingPage_option'>
											{filteredCharacters.length > 0 ?
												<Form.Group>
													<RequireUser id={listing.offers.accepted?.user.id} silent>
														<Select
															name='characterId'
															value={listing.offers.accepted?.character ?
																listing.offers.accepted.character.id : ''}
															label='Character'
															required={listing.game.id === constants.gameIds.ACGC}
															options={filteredCharacters}
															optionsMapping={{
																value: 'id',
																label: (character: any) =>
																{
																	return (
																		`${character.name} (${character.town.name})`
																	);
																},
															}}
															useReactSelect
															option={
																(value: any) =>
																{
																	const character = filteredCharacters.find(c => c.id === value);

																	if (!character)
																	{
																		return null;
																	}

																	return (
																		<>
																			<Keyboard
																				name={character.name}
																				gameId={character.game.id}
																			/> (<Keyboard
																				name={character.town.name}
																				gameId={character.game.id}
																			/>)
																		</>
																	);
																}
															}
														/>
													</RequireUser>

													<RequireUser id={listing.creator.id} silent>
														<Select
															name='characterId'
															value={listing.character ?
																listing.character.id : ''}
															label='Character'
															required={listing.game.id === constants.gameIds.ACGC}
															options={filteredCharacters}
															optionsMapping={{
																value: 'id',
																label: (character: any) =>
																{
																	return (
																		`${character.name} (${character.town.name})`
																	);
																},
															}}
															useReactSelect
															option={
																(value: any) =>
																{
																	const character = filteredCharacters.find(c => c.id === value);

																	if (!character)
																	{
																		return null;
																	}

																	return (
																		<>
																			<Keyboard
																				name={character.name}
																				gameId={character.game.id}
																			/> (<Keyboard
																				name={character.town.name}
																				gameId={character.game.id}
																			/>)
																		</>
																	);
																}
															}
														/>
													</RequireUser>
												</Form.Group>
												:
												towns.length === 0 ?
													<>
														{'You have no towns set up. '}
														<Link to={`/profile/${encodeURIComponent(Number(currentUser?.id || 0))}/towns/add`}>{'Click here'}</Link>
														{' to setup a town.'}
													</>
													:
													characters.length > 0 ?
														<>
															{'None of your current characters are associated with a friend code. '}
															<Link to={`/profile/${encodeURIComponent(Number(currentUser?.id || 0))}/friend-codes`}>{'Click here'}</Link>
															{' to update your friend codes.'}
														</>
														:
														<>
															{'You have no characters set up. '}
															<Link to={`/profile/${encodeURIComponent(Number(currentUser?.id || 0))}/characters/add`}>{'Click here'}</Link>
															{' to add a new character.'}
														</>


											}
										</div>

										{listing.game.id === constants.gameIds.ACGC ?
											filteredCharacters.length > 0 &&
												<div className='ListingPage_secretCode'>
													{listing.character &&
														<RequireUser id={listing.offers.accepted?.user.id} silent>
															<h3 className='ListingPage_acceptedCharacter'>
																Listing Creator's Character: <span>
																	<Keyboard
																		name={listing.character.name}
																		gameId={listing.game.id}
																	/>
																	{' '}(<Link to={`/profile/${encodeURIComponent(listing.creator.id)}/towns`}>
																		<Keyboard
																			name={listing.character.town.name}
																			gameId={listing.game.id}
																		/>
																	</Link>)
																</span>
															</h3>

															<div className='ListingPage_items'>
																{(listing.type === constants.tradingPost.listingTypes.sell && listing.offers.accepted ?
																	listing.offers.accepted.items :
																	listing.items)
																	.map((item, index) =>
																		<Form.Group key={index}>
																			<Text
																				name='secretCodes'
																				value={item.secretCode ? item.secretCode : ''}
																				label={`Secret Code for ${item.name}`}
																				placeholder={constants.placeholders.secretCode}
																				pattern={constants.regexes.secretCode}
																			/>
																		</Form.Group>,
																	)}
															</div>
														</RequireUser>
													}

													{!!listing.offers.accepted && !!listing.offers.accepted.character &&
														<RequireUser id={listing.creator.id} silent>
															<h3 className='ListingPage_acceptedCharacter'>
																Accepted Offer's Character: <span>
																	<Keyboard
																		name={listing.offers.accepted.character.name}
																		gameId={listing.game.id}
																	/>
																	{' '}(<Link to={`/profile/${encodeURIComponent(listing.offers.accepted.user.id)}/towns`}>
																		<Keyboard
																			name={listing.offers.accepted.character.town.name}
																			gameId={listing.game.id}
																		/>
																	</Link>)
																</span>
															</h3>

															<div className='ListingPage_items'>
																{(listing.type === constants.tradingPost.listingTypes.sell ?
																	listing.items :
																	listing.offers.accepted.items)
																	.map((item, index) =>
																		<div key={index}>
																			<Form.Group key={index}>
																				<Text
																					name='secretCodes'
																					value={item.secretCode ? item.secretCode : ''}
																					label={`Secret Code for ${item.name}`}
																					placeholder={constants.placeholders.secretCode}
																					pattern={constants.regexes.secretCode}
																				/>
																			</Form.Group>
																		</div>,
																	)}
															</div>
														</RequireUser>
													}
												</div>

											:
											<div className='ListingPage_codes'>
												<h4 className='ListingPage_or'>OR</h4>
												<Form.Group>
													<RequireUser id={listing.offers.accepted?.user.id} silent>
														<Text
															name='friendCode'
															label='Friend Code'
															value={listing.offers.accepted?.friendCode}
															placeholder={game?.placeholder}
															pattern={game?.pattern}
														/>
													</RequireUser>
													<RequireUser id={listing.creator.id} silent>
														<Text
															name='friendCode'
															label='Friend Code'
															value={listing.friendCode}
															placeholder={game?.placeholder}
															pattern={game?.pattern}
														/>
													</RequireUser>
												</Form.Group>

												{listing.game.id === constants.gameIds.ACNH &&
													<>
														<h4 className='ListingPage_or'>OR</h4>
														<Form.Group>
															<RequireUser id={listing.offers.accepted?.user.id} silent>
																<Text
																	name='dodoCode'
																	label='Dodo Code'
																	value={listing.offers.accepted?.dodoCode}
																	placeholder={constants.placeholders.dodoCode}
																	pattern={constants.regexes.dodoCode}
																	maxLength={5}
																	minLength={5}
																/>
															</RequireUser>
															<RequireUser id={listing.creator.id} silent>
																<Text
																	name='dodoCode'
																	label='Dodo Code'
																	value={listing.dodoCode}
																	placeholder={constants.placeholders.dodoCode}
																	pattern={constants.regexes.dodoCode}
																	maxLength={5}
																	minLength={5}
																/>
															</RequireUser>
														</Form.Group>
													</>
												}
											</div>
										}
									</Form>
									:
									<Form action='v1/trading_post/listing/address'
										callback={`/trading-post/${encodedId}`}
										className='ListingPage_address'
										showButton
									>
										<input type='hidden' name='id' value={listing.id} />

										<Form.Group>
											<RequireUser id={listing.offers.accepted?.user.id} silent>
												<TextArea
													name='address'
													label='Address'
													value={listing.offers.accepted?.address}
													required
													maxLength={constants.max.address}
												/>
											</RequireUser>

											<RequireUser id={listing.creator.id} silent>
												<TextArea
													name='address'
													label='Address'
													value={listing.address}
													required
													maxLength={constants.max.address}
												/>
											</RequireUser>
										</Form.Group>
									</Form>

							)}

							{listing.status === constants.tradingPost.listingStatuses.inProgress &&
								<div className='ListingPage_inProgress'>
									{listing.game && listing.game.id === constants.gameIds.ACGC ?
										listing.offers.accepted?.items.some(item => item.secretCode) &&
											listing.items.some(item => item.secretCode) &&
											<div className='ListingPage_secretCodes'>
												<h3>Secret Codes</h3>
												<RequireUser id={listing.offers.accepted.user.id} silent>
													{(listing.type === constants.tradingPost.listingTypes.sell ?
														listing.items :
														listing.offers.accepted.items)
														.filter(item => item.secretCode)
														.map((item, index) =>
															<div key={index}>
																<label>Secret Code for {item.name}: </label>
																<span>{item.secretCode}</span>
															</div>,
														)}
												</RequireUser>
												<RequireUser id={listing.creator.id} silent>
													{(listing.type === constants.tradingPost.listingTypes.sell ?
														listing.offers.accepted.items :
														listing.items)
														.filter(item => item.secretCode)
														.map((item, index) =>
															<div key={index}>
																<label>Secret Code for {item.name}: </label>
																<span>{item.secretCode}</span>
															</div>,
														)}
												</RequireUser>
											</div>

										:
										listing.game ?
											((listing.dodoCode || listing.friendCode) && currentUser?.id === listing.offers.accepted?.user.id ||
											(listing.offers.accepted?.dodoCode || listing.offers.accepted?.friendCode) && currentUser?.id === listing.creator.id) &&
												<div className='ListingPage_codes'>
													<RequireUser id={listing.offers.accepted?.user.id} silent>
														<h3>Listing Creator's {listing.dodoCode ? 'Dodo Code' : 'Friend Code'}:</h3>
														{' '}{listing.dodoCode ? listing.dodoCode : listing.friendCode}
													</RequireUser>
													<RequireUser id={listing.creator.id} silent>
														<h3>Accepted Offer's {listing.offers.accepted?.dodoCode ? 'Dodo Code' : 'Friend Code'}:</h3>
														{' '}{listing.offers.accepted?.dodoCode ? listing.offers.accepted?.dodoCode : listing.offers.accepted?.friendCode}
													</RequireUser>
												</div>

											:
											<div className='ListingPage_address'>
												<RequireUser id={listing.offers.accepted?.user.id} silent>
													<h3>Listing Creator's Address:</h3>
													{listing.address.split('\n').map((i, key) =>
													{
														return <div key={key}>{i}</div>;
													})}
												</RequireUser>
												<RequireUser id={listing.creator.id} silent>
													<h3>Accepted Offer's Address:</h3>
													{listing.offers.accepted?.address.split('\n').map((i, key) =>
													{
														return <div key={key}>{i}</div>;
													})}
												</RequireUser>
											</div>

									}

									<div className='ListingPage_status'>
										<RequireUser id={listing.offers.accepted?.user.id} silent>
											<div className='ListingPage_statusHeader'>
												<div className='ListingPage_statusName'>
													Status
												</div>
												<div className='ListingPage_links'>
													{!listing.offers.accepted?.completed &&
														<Confirm
															action='v1/trading_post/listing/completed'
															callback={`/trading-post/${encodedId}`}
															id={listing.id}
															label='Completed'
															message='Are you sure you want to make your side of this trade as completed?'
														/>
													}
													{!listing.offers.accepted?.failed &&
														<Confirm
															action='v1/trading_post/listing/failed'
															callback={`/trading-post/${encodedId}`}
															id={listing.id}
															label='Failed'
															message='Are you sure you want to make your side of this trade as failed?'
														/>
													}
												</div>
											</div>
											{listing.completed || listing.failed ?
												<>
													{listing.completed &&
														<>
															{listing.creator.username} has marked the trade as completed.
														</>
													}
													{listing.failed &&
														<>
															{listing.creator.username} has marked the trade as failed.
														</>
													}
												</>
												:
												'This trade is currently in progress.'
											}
										</RequireUser>

										<RequireUser id={listing.creator.id} silent>
											<div className='ListingPage_statusHeader'>
												<div className='ListingPage_statusName'>
													Status
												</div>
												<div className='ListingPage_links'>
													{!listing.completed &&
														<Confirm
															action='v1/trading_post/listing/completed'
															callback={`/trading-post/${encodedId}`}
															id={listing.id}
															label='Completed'
															message='Are you sure you want to make your side of this trade as completed?'
														/>
													}
													{!listing.failed &&
														<Confirm
															action='v1/trading_post/listing/failed'
															callback={`/trading-post/${encodedId}`}
															id={listing.id}
															label='Failed'
															message='Are you sure you want to make your side of this trade as failed?'
														/>
													}
												</div>
											</div>
											{listing.offers.accepted?.completed || listing.offers.accepted?.failed ?
												<>
													{listing.offers.accepted.completed &&
														<>
															{listing.offers.accepted.user.username} has marked the trade as completed.
														</>
													}
													{listing.offers.accepted.failed &&
														<>
															{listing.offers.accepted.user.username} has marked the trade as failed.
														</>
													}
												</>
												:
												'This trade is currently in progress.'
											}
										</RequireUser>
									</div>
								</div>
							}

							{[
								constants.tradingPost.listingStatuses.completed,
								constants.tradingPost.listingStatuses.failed,
							].includes(listing.status) &&
								<div className='ListingPage_feedback'>
									<h3>Submit Feedback</h3>

									<Form
										action='v1/rating/save'
										callback={`/trading-post/${encodedId}`}
										showButton
									>
										<input type='hidden'
											name='listingId' value={listing.id}
										/>

										<div className='ListingPage_ratingOptions'>
											<RequireUser id={listing.offers.accepted?.user.id} silent>
												<input type='hidden'
													name='userId'
													value={listing.creator.id}
												/>
												<input type='hidden'
													name='id'
													value={listing.offers.accepted?.rating ? listing.offers.accepted.rating.id : 0}
												/>

												<Form.Group>
													<Check
														options={showRatings}
														name={`rating`}
														defaultValue={listing.offers.accepted?.rating ? listing.offers.accepted.rating.rating : ''}
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
														value={listing.offers.accepted?.rating ?
															listing.offers.accepted.rating.comment : ''}
														maxLength={constants.max.comment}
													/>
												</Form.Group>
											</RequireUser>

											<RequireUser id={listing.creator.id} silent>
												<input type='hidden'
													name='userId'
													value={listing.offers.accepted?.user.id}
												/>
												<input type='hidden'
													name='id'
													value={listing.rating ? listing.rating.id : 0}
												/>

												<Form.Group>
													<Check
														options={showRatings}
														name={`rating`}
														defaultValue={listing.rating ? listing.rating.rating : ''}
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
														value={listing.rating ?
															listing.rating.comment : ''}
														maxLength={constants.max.comment}
													/>
												</Form.Group>
											</RequireUser>
										</div>
									</Form>
								</div>
							}
						</>
					}
				</UserContext.Consumer>

				{listing.status === constants.tradingPost.listingStatuses.closed && !!listing.offers.accepted &&
					<div className='ListingPage_ratings'>
						<div className='ListingPage_listing'>
							<Rating
								rating={listing.rating}
							/>
						</div>

						<div className='ListingPage_offer'>
							<Rating
								rating={listing.offers.accepted.rating}
							/>
						</div>
					</div>
				}

				<div className='ListingPage_chat'>
					<h3>Listing Chat:</h3>

					<div className='ListingPage_comments'>
						{listing.comments.length > 0 ?
							listing.comments.map(comment =>
								<div key={comment.id} className='ListingPage_comment'>
									<div className='ListingPage_commentBy'>
										<ReportProblem
											type={constants.userTicket.types.listingComment}
											id={comment.id}
										/>
										<UserContext.Consumer>
											{currentUser =>
												currentUser ?
													<>
														Comment By: <Link to={`/profile/${encodeURIComponent(comment.user.id)}`}>
															{comment.user.username}
														</Link> on {comment.formattedDate}
													</>
													:
													<>
														Comment By: {comment.user.username} on {comment.formattedDate}
													</>

											}
										</UserContext.Consumer>
									</div>

									<div className='ListingPage_comment'>
										<Markup
											text={comment.comment}
											format={comment.format ?
												comment.format :
												'markdown'}
											emojiSettings={userEmojiSettings?.filter(s => s.userId === comment.user.id)}
										/>
									</div>
								</div>,
							)
							:
							'No comments have been made.'
						}
					</div>

					{listing.status === constants.tradingPost.listingStatuses.open &&
						<RequireUser silent>
							<div className='ListingPage_makeComment'>
								<Form
									action='v1/trading_post/listing/comment'
									callback={`/trading-post/${encodedId}`}
									showButton
								>
									<input type='hidden' name='id' value={listing.id} />

									<Form.Group>
										<RichTextArea
											textName='comment'
											formatName='format'
											label='Comment'
											emojiSettings={currentUserEmojiSettings}
											maxLength={constants.max.comment}
											required
											key={Math.random()}
										/>
									</Form.Group>
								</Form>
							</div>
						</RequireUser>
					}

					{[constants.tradingPost.listingStatuses.offerAccepted, constants.tradingPost.listingStatuses.inProgress, constants.tradingPost.listingStatuses.completed].includes(listing.status) &&
						<div className='ListingPage_makeComment'>
							<RequireUser id={listing.offers.accepted?.user.id} silent>
								<Form
									action='v1/trading_post/listing/comment'
									callback={`/trading-post/${encodedId}`}
									showButton
								>
									<input type='hidden' name='id' value={listing.id} />

									<Form.Group>
										<RichTextArea
											textName='comment'
											formatName='format'
											label='Comment'
											emojiSettings={currentUserEmojiSettings}
											maxLength={constants.max.comment}
											required
											key={Math.random()}
										/>
									</Form.Group>
								</Form>
							</RequireUser>

							<RequireUser id={listing.creator.id} silent>
								<Form
									action='v1/trading_post/listing/comment'
									callback={`/trading-post/${encodedId}`}
									showButton
								>
									<input type='hidden' name='id' value={listing.id} />

									<Form.Group>
										<RichTextArea
											textName='comment'
											formatName='format'
											label='Comment'
											emojiSettings={currentUserEmojiSettings}
											maxLength={constants.max.comment}
											required
											key={Math.random()}
										/>
									</Form.Group>
								</Form>
							</RequireUser>
						</div>
					}
				</div>
			</RequirePermission>
		</div>
	);
};

export async function loadData(this: APIThisType, { id }: { id: string }): Promise<ListingPageProps>
{
	const [listing, characters, games, towns, friendCodes, currentUserEmojiSettings] = await Promise.all([
		this.query('v1/trading_post/listing', { id: id }),
		this.query('v1/users/characters'),
		this.query('v1/games'),
		this.query('v1/users/towns'),
		this.query('v1/users/friend_codes'),
		this.query('v1/settings/emoji'),
	]);

	const [userEmojiSettings] = await Promise.all([
		listing.comments.length > 0 ? this.query('v1/settings/emoji', { userIds: listing.comments.map((c: any) => c.user.id) }) : null,
	]);

	const game = listing.game ? games.find((game: any) => game.acGameId === listing.game.id) : null;

	return {
		listing,
		characters,
		game,
		towns,
		friendCodes: friendCodes.results,
		userEmojiSettings,
		currentUserEmojiSettings,
	};
}

type ListingPageProps = {
	listing: ListingType
	characters: CharacterType[]
	game: GamesType | null,
	towns: TownType[]
	friendCodes: UserFriendCodesType['results']
	userEmojiSettings: EmojiSettingType[] | null
	currentUserEmojiSettings: EmojiSettingType[]
};

export default ListingPage;
