import { type RouteConfig, index, route, layout, prefix } from '@react-router/dev/routes';

export default [
	index('pages/HomePage.tsx'),
	...prefix('admin', [
		index('pages/admin/AdminHomePage.tsx'),
		route('permissions/:id?', 'pages/admin/AdminPermissionsPage.tsx'),
		route('game-consoles', 'pages/admin/AdminGameConsolesPage.tsx'),
		route('game-console/add', 'pages/admin/AddAdminGameConsolePage.tsx'),
		route('game-console/:id', 'pages/admin/AdminGamesPage.tsx'),
		route('game-console/:id/edit', 'pages/admin/EditAdminGameConsolePage.tsx'),
		route('game-console/:id/add-game', 'pages/admin/AddAdminGamePage.tsx'),
		route('game/:id/edit', 'pages/admin/EditAdminGamePage.tsx'),
		route('weekly-polls/:type?', 'pages/admin/AdminWeeklyPollsPage.tsx'),
		route('weekly-poll/:id/edit', 'pages/admin/EditWeeklyPollPage.tsx'),
		route('weekly-poll/add', 'pages/admin/AddWeeklyPollPage.tsx'),
		route('board', 'pages/admin/AdminBoardPage.tsx'),
	]),
	...prefix('rules', [
		index('pages/admin/AdminRulesPage.tsx'),
		route('add', 'pages/admin/AddAdminRulePage.tsx'),
		route(':ruleId', 'pages/admin/EditAdminRulePage.tsx'),
		route(':ruleId/add', 'pages/admin/AddAdminRuleViolationPage.tsx'),
		route(':ruleId/:violationId', 'pages/admin/EditAdminRuleViolationPage.tsx'),
	]),
	route('profanity', 'pages/admin/AdminProfanityPage.tsx'),
	route('modmin', 'pages/admin/ModminHomePage.tsx'),
	route('automation', 'pages/automation/AutomationPage.tsx'),
	route('forums/:id/:page?/:editId?', 'pages/NodePage.tsx'),
	route('forums/:id/history', 'pages/NodeHistoryPage.tsx'),
	route('followed/:type', 'pages/FollowedNodePage.tsx'),
	route('threads/:userId', 'pages/ThreadsPage.tsx'),
	layout('pages/settings/SettingsPage.tsx', [
		...prefix('settings', [
			route('account', 'pages/settings/AccountSettingsPage.tsx'),
			route('avatar', 'pages/settings/AvatarSettingsPage.tsx'),
			route('forum', 'pages/settings/ForumSettingsPage.tsx'),
			route('emoji', 'pages/settings/EmojiSettingsPage.tsx'),
		]),
	]),
	...prefix('legal', [
		route('coppa', 'pages/legal/COPPAPage.tsx'),
		route('privacy', 'pages/legal/PrivacyPage.tsx'),
		route('terms', 'pages/legal/TOSPage.tsx'),
		route('policies', 'pages/legal/PoliciesPage.tsx'),
		route('cookies', 'pages/legal/CookiePolicyPage.tsx'),
	]),
	route('faq', 'pages/FAQPage.tsx'),
	route('credits', 'pages/legal/CreditsPage.tsx'),
	route('menu', 'pages/SitemapPage.tsx'),
	route('staff', 'pages/StaffPage.tsx'),
	route('staff-roles/:id?', 'pages/StaffRolesPage.tsx'),
	route('guidelines', 'pages/legal/SiteRulesPage.tsx'),
	layout('pages/profile/ProfilePage.tsx', [
		...prefix('profile/:id', [
			index('pages/profile/ProfileBioPage.tsx'),
			route('edit', 'pages/profile/EditProfileBioPage.tsx'),
			layout('pages/profile/ProfileFriendCodesPage.tsx', [
				route('friend-codes', 'pages/friend_code/UserFriendCodesPage.tsx'),
				route('friend-code/add', 'pages/friend_code/AddFriendCodePage.tsx'),
				route('friend-code/:friendCodeId/edit', 'pages/friend_code/EditFriendCodePage.tsx'),
			]),
			layout('pages/profile/ProfileTownsPage.tsx', [
				route('towns', 'pages/town/UserTownsPage.tsx'),
				route('towns/add/:gameId?', 'pages/town/AddTownPage.tsx'),
				route('town/:townId', 'pages/town/UserTownPage.tsx'),
				route('town/:townId/edit', 'pages/town/EditTownPage.tsx'),
				route('town/:townId/map', 'pages/town/MapMakerPage.tsx'),
				route('town/:townId/tune', 'pages/town/EditTownTunePage.tsx'),
				route('town/:townId/pattern', 'pages/town/AddTownFlagPage.tsx'),
				route('characters/add/:townId?', 'pages/character/AddCharacterPage.tsx'),
				route('character/:characterId/edit', 'pages/character/EditCharacterPage.tsx'),
			]),
			route('character/:characterId/pattern', 'pages/character/AddCharacterDoorPage.tsx'),
			route('security', 'pages/profile/ProfileAdminPage.tsx'),
		]),
	]),
	route('town-tune/:id/edit', 'pages/tune/EditTunePage.tsx'),
	route('town-tune/:id/choose', 'pages/tune/ChooseTownTunePage.tsx'),
	route('town-tunes', 'pages/tune/TunesPage.tsx'),
	route('town-tunes/add', 'pages/tune/AddTunePage.tsx'),
	route('pattern/:id', 'pages/pattern/PatternPage.tsx'),
	route('pattern/:id/edit', 'pages/pattern/EditPatternPage.tsx'),
	route('pattern/:id/choose/town', 'pages/pattern/ChooseTownFlagPage.tsx'),
	route('pattern/:id/choose/door', 'pages/pattern/ChooseDoorPatternPage.tsx'),
	route('patterns', 'pages/pattern/PatternsPage.tsx'),
	route('patterns/add', 'pages/pattern/AddPatternPage.tsx'),
	layout('pages/user/CatalogPage.tsx', [
		...prefix('catalog/:userId', [
			route('user', 'pages/user/UserCatalogPage.tsx'),
			route('user/edit', 'pages/user/EditUserCatalogPage.tsx'),
			route('pc', 'pages/user/PCCatalogPage.tsx'),
			route('pc/edit', 'pages/user/EditPCCatalogPage.tsx'),
			route('character/:characterId', 'pages/character/CharacterCatalogPage.tsx'),
			route('character/:characterId/edit', 'pages/character/EditCharacterCatalogPage.tsx'),
		]),
	]),
	route('friend-codes', 'pages/friend_code/FriendCodesPage.tsx'),
	route('ratings/:userId/:type', 'pages/rating/UserReceivedRatingsPage.tsx'),
	route('ratings/:userId/:type/given', 'pages/rating/UserGivenRatingsPage.tsx'),
	...prefix('trading-post', [
		index('pages/trading_post/TradingPostPage.tsx'),
		route(':userId/all', 'pages/trading_post/UserListingPage.tsx'),
		route('add/:type?/:gameId?', 'pages/trading_post/AddListingPage.tsx'),
		route(':id', 'pages/trading_post/ListingPage.tsx'),
		route(':id/offer', 'pages/trading_post/AddOfferPage.tsx'),
	]),
	route('features', 'pages/feature/FeaturesDashboardPage.tsx'),
	route('feature/:id', 'pages/feature/FeaturePage.tsx'),
	route('feature/:id/edit', 'pages/feature/EditFeaturePage.tsx'),
	route('features/add', 'pages/feature/AddFeaturePage.tsx'),
	route('buddies', 'pages/user/BuddyPage.tsx'),
	route('guides/:gameId?', 'pages/guide/GuidesPage.tsx'),
	route('guides/:gameId/add', 'pages/guide/AddGuidePage.tsx'),
	route('guide/:id', 'pages/guide/GuidePage.tsx'),
	route('guide/:id/edit', 'pages/guide/EditGuidePage.tsx'),
	route('calendar', 'pages/CalendarPage.tsx'),
	route('user-tickets', 'pages/admin/UserTicketDashboardPage.tsx'),
	route('user-ticket/:id', 'pages/admin/UserTicketPage.tsx'),
	route('support-emails', 'pages/admin/SupportEmailDashboardPage.tsx'),
	route('support-emails/send', 'pages/admin/SendSupportEmailPage.tsx'),
	route('support-email/:id', 'pages/admin/SupportEmailPage.tsx'),
	route('tickets', 'pages/user/TicketsPage.tsx'),
	route('ticket/:id', 'pages/user/TicketPage.tsx'),
	...prefix('scout-hub', [
		index('pages/scout-hub/ScoutHubPage.tsx'),
		route('adoption/settings', 'pages/scout-hub/AdoptionThreadSettingsPage.tsx'),
		layout('pages/headers/ScoutThreadBanner.tsx', [
			route('adoption/:id/:page?/:editId?', 'pages/NodePage.tsx', { id: 'node-scout' }, []),
		]),
		route('new-members', 'pages/scout-hub/NewMembersPage.tsx'),
		route('new-members/reassign/:adopteeId', 'pages/scout-hub/ReassignPage.tsx'),
		route('settings', 'pages/scout-hub/ScoutSettingsPage.tsx'),
		route('ratings/:userId', 'pages/scout-hub/ScoutRatingsPage.tsx'),
	]),
	route('new-member', 'pages/user/NewMemberPage.tsx'),
	route('user-matching', 'pages/admin/UserMatchingPage.tsx'),
	route('notifications', 'pages/NotificationsPage.tsx'),
	route('honorary-citizens', 'pages/HonoraryCitizensPage.tsx'),
	route('donate', 'pages/DonatePage.tsx'),
	route('donated', 'pages/DonatedPage.tsx'),
	route('top-bells', 'pages/TopBellsPage.tsx'),
	...prefix('bell-shop', [
		route(':categoryId?', 'pages/bell_shop/BellShopPage.tsx'),
		route(':id/gift', 'pages/bell_shop/BellShopGiftPage.tsx'),
		route('redeemed', 'pages/bell_shop/BellShopRedeemedPage.tsx'),
	]),
	route('support-tickets', 'pages/admin/SupportTicketDashboardPage.tsx'),
	route('support-tickets/add', 'pages/admin/AddSupportTicketPage.tsx'),
	route('support-ticket/:id', 'pages/admin/SupportTicketPage.tsx'),
	route('user-sessions', 'pages/admin/UserSessionsPage.tsx'),
	route('user-session/:id', 'pages/admin/UserSessionPage.tsx'),
	route('sign-up', 'pages/signup/SignupPage.tsx'),
	route('congrats', 'pages/signup/CongratsPage.tsx'),
	route('consent-needed/:id', 'pages/signup/ConsentNeededPage.tsx'),
	route('consent/:id', 'pages/signup/ConsentPage.tsx'),
	route('email-needed/:id', 'pages/signup/EmailNeededPage.tsx'),
	route('site-statistics', 'pages/SiteStatisticsPage.tsx'),
	route('leaving', 'pages/LeavingSitePage.tsx'),
	route('avatars', 'pages/avatar/AvatarPage.tsx'),
	route('shops', 'pages/shop/ShopsPage.tsx'),
	route('shop/:id', 'pages/shop/ShopPage.tsx'),
	route('shop/:id/edit', 'pages/shop/EditShopPage.tsx'),
	route('shops/add', 'pages/shop/AddShopPage.tsx'),
	route('shop/:id/employees', 'pages/shop/EmployeesPage.tsx'),
	route('shop/:id/services', 'pages/shop/ServicesPage.tsx'),
	route('shops/threads', 'pages/shop/ShopThreadsPage.tsx'),
	route('shop/application/:id', 'pages/shop/ApplicationPage.tsx'),
	route('shop/order/:id', 'pages/shop/OrderPage.tsx'),
	route('shops/ratings/:userId', 'pages/shop/EmployeeRatingsPage.tsx'),
	layout('pages/headers/ShopThreadBanner.tsx', [
		route('shops/threads/:id/:page?/:editId?', 'pages/NodePage.tsx', { id: 'node-shop' }, []),
	]),
	route('test-site-password', 'pages/TestSitePasswordPage.tsx'),
	route('*?', 'catchall.tsx'),
] satisfies RouteConfig;
