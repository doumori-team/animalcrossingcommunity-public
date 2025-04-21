import { ReactNode, useState, use } from 'react';
import { Link } from 'react-router';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

import { constants, utils, routerUtils } from '@utils';
import { RequireUser, RequirePermission, RequireClientJS } from '@behavior';
import Shop from '@/components/shop/Shop.tsx';
import { Header, Section, Tabs, Markup, ErrorMessage, ContentBox, ReportProblem, RequireLargeScreen } from '@layout';
import { Alert, Form, RichTextArea, Select, Text, Confirm } from '@form';
import StatusIndicator from '@/components/nodes/StatusIndicator.tsx';
import TotalRatings from '@/components/ratings/TotalRatings.tsx';
import {
	APIThisType,
	ShopType,
	ServiceType,
	EmojiSettingType,
	RoleType,
	ShopCatalogType,
	ACGameType,
	ElementSelectType,
	ElementInputType,
} from '@types';

export const action = routerUtils.formAction;

const ShopPage = ({ loaderData }: { loaderData: Promise<ShopPageProps> }) =>
{
	const { shop, shopServices, currentUserEmojiSettings, shopRoles,
		acGameCatalogs, acgames } = getData(use(loaderData));

	const [gameId, setGameId] = useState<number | null>(null);
	const [serviceId, setServiceId] = useState<string | null>(null);
	const [items, setItems] = useState<string[]>([]);
	const [quantities, setQuantities] = useState<number[]>([]);
	const [roleId, setRoleId] = useState<number | null>(null);

	const changeGame = (e: ElementSelectType): void =>
	{
		setGameId(Number(e.target.value));
	};

	const changeService = (e: ElementSelectType): void =>
	{
		setServiceId(e.target.value);
	};

	const changeRole = (e: ElementSelectType): void =>
	{
		setRoleId(Number(e.target.value));
	};

	const changeItems = (newItems: string[]) =>
	{
		// map old quantities to new quantity indexes
		let newQuantities: number[] = [];

		newItems.map((itemId: string, index: number) =>
		{
			let itemIndex = items.findIndex(id => id === itemId);

			if (itemIndex >= 0)
			{
				newQuantities[index] = quantities[itemIndex];
			}
			else
			{
				newQuantities[index] = 1;
			}
		});

		setItems(newItems);
		setQuantities(newQuantities);
	};

	const changeQuantity = (index: number, event: ElementInputType): void =>
	{
		let newQuantities = [...quantities];
		newQuantities[index] = Number(event.target.value);

		setQuantities(newQuantities);
	};

	const getOrderSection = (): ReactNode =>
	{
		if (shopServices.length === 0)
		{
			return (
				<Alert type='warning'>
					There are no services setup for this shop.
				</Alert>
			);
		}
		else if (shop.vacation && shop.vacation.current)
		{
			return (
				<Alert>
					We're currently on vacation and are not taking orders at this time.
				</Alert>
			);
		}
		else if (shop.pendingOrder)
		{
			return (
				<Alert>
					You currently have a pending order. Please complete it before ordering again.
				</Alert>
			);
		}
		else
		{
			return (
				<>
					<ul className='ShopPage_services'>
						{shopServices.map(service =>
							service.default ?
								<li key={service.id}>{service.name}: {service.description}</li>
								:
								<li key={service.id}><ReportProblem type={constants.userTicket.types.shopServiceName} id={service.id} />{service.name}: <ReportProblem type={constants.userTicket.types.shopServiceDescription} id={service.id} />{service.description}</li>
							,
						)}
					</ul>

					<RequireClientJS fallback={
						<ErrorMessage identifier='javascript-required' />
					}
					>
						<Form action='v1/shop/order' showButton>
							<input type='hidden' name='id' value={shop.id} />

							<Form.Group>
								<Select
									label='Game'
									name='gameId'
									value={gameId}
									options={acgames.filter(g => g.hasTown === true && shop.games.find(sg => sg.id === g.id))}
									optionsMapping={{ value: 'id', label: 'name' }}
									placeholder='Choose Animal Crossing game...'
									required
									changeHandler={changeGame}
								/>
							</Form.Group>

							{!!gameId &&
								<>
									<Form.Group>
										<Select
											label='Service'
											name='serviceId'
											options={shopServices.filter(s => s.games.some(g => g.id === gameId))}
											optionsMapping={{ value: 'id', label: 'name' }}
											placeholder='Choose a service...'
											required
											changeHandler={changeService}
											value={serviceId}
										/>
									</Form.Group>

									{serviceId === `default_${constants.shops.itemsServiceId}` &&
										<>
											<Form.Group>
												<Select
													name='items'
													label='Item(s)'
													multiple
													async
													options={acGameCatalogs.find(g => g.gameId === gameId)?.items.filter(item => item.tradeable && !shop.games.find(sg => sg.id === gameId)?.items.includes(item.id))}
													optionsMapping={{ value: 'id', label: 'name' }}
													placeholder='Select item(s)...'
													groupBy='categoryName'
													size={15}
													changeHandler={changeItems}
													value={items}
												/>
											</Form.Group>

											{items.length > 0 &&
												<div className='ShopPage_option'>
													{items.map((itemId, index) =>
														<Form.Group key={index}>
															<Text
																type='number'
																label={`${acGameCatalogs.find(g => g.gameId === gameId)?.items.find(item => item.id === itemId)?.name} Quantity`}
																name='quantities'
																value={quantities[index]}
																changeHandler={(e) => changeQuantity(index, e)}
																required
																max={constants.max.number}
																min={constants.min.number}
															/>
														</Form.Group>,
													)}
												</div>
											}
										</>
									}
								</>
							}

							<Form.Group>
								<Text
									label='Additional Information'
									name='comment'
									maxLength={constants.max.shopOrderComment}
								/>
							</Form.Group>
						</Form>
					</RequireClientJS>
				</>
			);
		}
	};

	const getApplySection = (): ReactNode =>
	{
		if (shopRoles.length === 0)
		{
			return (
				<Alert type='warning'>
					There are no roles setup for this shop.
				</Alert>
			);
		}
		else
		{
			return (
				<>
					<ul className='ShopPage_roles'>
						{shopRoles.map(role =>
							<li key={role.id}><ReportProblem type={constants.userTicket.types.shopRoleName} id={role.id} />{role.name}: <ReportProblem type={constants.userTicket.types.shopRoleDescription} id={role.id} />{role.description} (Available: {role.positionsAvailable})</li>,
						)}
					</ul>

					<RequireClientJS fallback={
						<ErrorMessage identifier='javascript-required' />
					}
					>
						<Form action='v1/shop/apply' showButton>
							<input type='hidden' name='id' value={shop.id} />

							<Form.Group>
								<Select
									label='Role'
									name='roleId'
									options={shopRoles}
									optionsMapping={{ value: 'id', label: 'name' }}
									placeholder='Choose a role...'
									required
									value={roleId}
									changeHandler={changeRole}
								/>
							</Form.Group>

							{roleId &&
								<Form.Group>
									<Select
										label='Game(s)'
										name='gameIds'
										options={shopRoles.find(sr => sr.id === roleId)?.games}
										optionsMapping={{ value: 'id', label: 'name' }}
										placeholder='Choose Animal Crossing game(s)...'
										required
										multiple
									/>
								</Form.Group>
							}

							<Form.Group>
								<RichTextArea
									textName='text'
									formatName='format'
									label='Application'
									emojiSettings={currentUserEmojiSettings}
									maxLength={constants.max.post1}
									required
								/>
							</Form.Group>
						</Form>
					</RequireClientJS>
				</>
			);
		}
	};

	const getContactUsSection = () =>
	{
		return (
			<Form action='v1/shop/contact' callback='/shops/threads/:id' showButton>
				<input type='hidden' name='id' value={shop.id} />

				<Form.Group>
					<RichTextArea
						textName='text'
						formatName='format'
						label='Message'
						emojiSettings={currentUserEmojiSettings}
						maxLength={constants.max.post1}
						required
					/>
				</Form.Group>
			</Form>
		);
	};

	const getStatsSection = (): ReactNode =>
	{
		return (
			<>
				<TotalRatings
					positiveRatingsTotal={shop.positiveRatingsTotal}
					neutralRatingsTotal={shop.neutralRatingsTotal}
					negativeRatingsTotal={shop.negativeRatingsTotal}
					type={constants.rating.types.shop}
				/>
				{shop.statData.length > 0 &&
					<>
						<h2>Orders Per Service & AC Game, Last 30 Days:</h2>
						<RequireLargeScreen size='657'>
							<BarChart
								width={500}
								height={300}
								data={shop.statData}
								margin={{
									top: 5,
									right: 30,
									left: 100,
									bottom: 5,
								}}
								layout='vertical'
							>
								<CartesianGrid strokeDasharray='3 3' />
								<XAxis type='number' />
								<YAxis type='category' dataKey='name' />
								<Tooltip />
								<Legend />
								{shop.games.map(g =>
									<Bar dataKey={g.shortname} fill={g.color} key={g.id}/>,
								)}
							</BarChart>
						</RequireLargeScreen>
					</>
				}
				{shop.extraStatData &&
					<>
						{shop.extraStatData.stats.length > 0 &&
							<>
								<h2>Orders Per User & Service, Last 30 Days:</h2>
								<RequireLargeScreen size='657'>
									<BarChart
										width={500}
										height={300}
										data={shop.extraStatData.stats}
										margin={{
											top: 5,
											right: 30,
											left: 100,
											bottom: 5,
										}}
										layout='vertical'
									>
										<CartesianGrid strokeDasharray='3 3' />
										<XAxis type='number' />
										<YAxis type='category' dataKey='username' />
										<Tooltip />
										<Legend />
										{shopServices.map(s =>
											<Bar dataKey={s.name} stackId='a' fill={utils.getRandomColor()} key={s.id} />,
										)}
									</BarChart>
								</RequireLargeScreen>
							</>
						}

						<h2>Active Stats of Users:</h2>
						<ul>
							{shop.extraStatData.employees.map(e =>
								<li key={e.id}>
									<Link to={`/profile/${encodeURIComponent(e.id)}`}>{e.username}</Link> <StatusIndicator lastActiveTime={e.lastActiveTime} showDate />
								</li>,
							)}
						</ul>
					</>
				}
			</>
		);
	};

	return (
		<div className='ShopPage'>
			<RequirePermission permission='view-shops'>
				{shop.header ?
					<Shop shop={shop} />
					:
					<Header
						name={
							<>
								<ReportProblem type={constants.userTicket.types.shopName} id={shop.id} />
								{shop.name}
							</>
						}
						description={
							<>
								<ReportProblem type={constants.userTicket.types.shopShortDescription} id={shop.id} />
								{shop.shortDescription}
							</>
						}
						description2={shop.vacation ? `Vacation: ${shop.vacation.formattedStartDate} - ${shop.vacation.formattedEndDate}` : null}
						links={
							<>
								<RequireUser ids={shop.owners.map(o => o.id)} permission='modify-shops' silent>
									<Link to={`/shop/${encodeURIComponent(shop.id)}/edit`}>
										Edit
									</Link>
								</RequireUser>
								{shop.transfer &&
									<Confirm
										action='v1/shop/transfer'
										id={shop.id}
										label='Transfer'
										message='Are you sure you want to transfer this shop to you?'
									/>
								}
								<Link to='/shops'>
									Shops
								</Link>
							</>
						}
					/>
				}

				<ContentBox>
					<ReportProblem type={constants.userTicket.types.shopDescription} id={shop.id} />
					<Markup
						text={shop.description.content}
						format={shop.description.format}
					/>
				</ContentBox>

				<Tabs
					defaultActiveKey='order'
					fallback={
						<>
							<Section>
								{getOrderSection()}
							</Section>
							<Section>
								{getApplySection()}
							</Section>
							<Section>
								{getContactUsSection()}
							</Section>
							<Section>
								{getStatsSection()}
							</Section>
						</>
					}
				>
					<Tabs.Tab eventKey='order' title='Order'>
						<Section>
							<RequirePermission permission='order-apply-shops'>
								{getOrderSection()}
							</RequirePermission>
						</Section>
					</Tabs.Tab>
					<Tabs.Tab eventKey='apply' title='Apply'>
						<Section>
							<RequirePermission permission='order-apply-shops'>
								{getApplySection()}
							</RequirePermission>
						</Section>
					</Tabs.Tab>
					<Tabs.Tab eventKey='contact' title='Contact Us'>
						<Section>
							{getContactUsSection()}
						</Section>
					</Tabs.Tab>
					<Tabs.Tab eventKey='stats' title='Statistics'>
						<Section>
							{getStatsSection()}
						</Section>
					</Tabs.Tab>
				</Tabs>
			</RequirePermission>
		</div>
	);
};

async function loadData(this: APIThisType, { id }: { id: string }): Promise<any>
{
	return Promise.all([
		this.query('v1/shop', { id: id }),
		this.query('v1/shop/services', { id: id }),
		this.query('v1/settings/emoji'),
		this.query('v1/shop/roles', { id: id, apply: true }),
		this.query('v1/shop/catalog', { id: id }),
		this.query('v1/acgames'),
	]);
}

function getData(data: any): ShopPageProps
{
	const [shop, shopServices, currentUserEmojiSettings, shopRoles, acGameCatalogs, acgames] = data;

	return { shop, shopServices, currentUserEmojiSettings, shopRoles, acGameCatalogs, acgames };
}

export const loader = routerUtils.deferLoader(loadData);

type ShopPageProps = {
	shop: ShopType
	shopServices: ServiceType[]
	currentUserEmojiSettings: EmojiSettingType[]
	shopRoles: RoleType[]
	acGameCatalogs: ShopCatalogType[]
	acgames: ACGameType[]
};

export default routerUtils.LoadingFunction(ShopPage);
