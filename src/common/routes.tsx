import React from 'react';
import { redirect, json, defer, redirectDocument } from 'react-router-dom';
import * as iso from 'common/iso.js';

import { constants } from '@utils';
import { UserLiteType } from '@types';

import App, { loadData as loadAppData } from './components/App.tsx';
import RouteError from '@/pages/RouteError.tsx';
import Loading from './components/layout/Loading.tsx';
import LeavingSitePage from '@/pages/LeavingSitePage.tsx';

import FollowedNodePage, { loadData as loadFollowedNodePageData } from '@/pages/FollowedNodePage.tsx';
import ThreadsPage, { loadData as loadThreadsPageData } from '@/pages/ThreadsPage.tsx';
import HomePage, { loadData as loadHomePageData } from '@/pages/HomePage.tsx';
import NodePage, { loadData as loadNodePageData } from '@/pages/NodePage.tsx';
import NodeHistoryPage, { loadData as loadNodeHistoryPageData } from '@/pages/NodeHistoryPage.tsx';
import SitemapPage from '@/pages/SitemapPage.tsx';
import StaffPage, { loadData as loadStaffPageData } from '@/pages/StaffPage.tsx';
import StaffRolesPage, { loadData as loadStaffRolesPageData } from '@/pages/StaffRolesPage.tsx';
import NotificationsPage, { loadData as loadNotificationsPageData } from '@/pages/NotificationsPage.tsx';

import AdminHomePage from '@/pages/admin/AdminHomePage.tsx';
import ModminHomePage from '@/pages/admin/ModminHomePage.tsx';
import AdminPermissionsPage, { loadData as loadAdminPermissionsPageData } from '@/pages/admin/AdminPermissionsPage.tsx';
import AdminGameConsolesPage, { loadData as loadAdminGameConsolesPageData } from '@/pages/admin/AdminGameConsolesPage.tsx';
import AdminGamesPage, { loadData as loadAdminGamesPageData } from '@/pages/admin/AdminGamesPage.tsx';
import AddAdminGameConsolePage, { loadData as loadAddAdminGameConsolePageData } from '@/pages/admin/AddAdminGameConsolePage.tsx';
import AddAdminGamePage, { loadData as loadAddAdminGamePageData } from '@/pages/admin/AddAdminGamePage.tsx';
import EditAdminGameConsolePage, { loadData as loadEditAdminGameConsolePageData } from '@/pages/admin/EditAdminGameConsolePage.tsx';
import EditAdminGamePage, { loadData as loadEditAdminGamePageData } from '@/pages/admin/EditAdminGamePage.tsx';
import AdminWeeklyPollsPage, { loadData as loadAdminWeeklyPollsPageData } from '@/pages/admin/AdminWeeklyPollsPage.tsx';
import AddWeeklyPollPage from '@/pages/admin/AddWeeklyPollPage.tsx';
import EditWeeklyPollPage, { loadData as loadEditWeeklyPollPageData } from '@/pages/admin/EditWeeklyPollPage.tsx';
import AdminRulesPage, { loadData as loadAdminRulesPageData } from '@/pages/admin/AdminRulesPage.tsx';
import AddAdminRulePage, { loadData as loadAddAdminRulePageData } from '@/pages/admin/AddAdminRulePage.tsx';
import AddAdminRuleViolationPage, { loadData as loadAddAdminRuleViolationPageData } from '@/pages/admin/AddAdminRuleViolationPage.tsx';
import EditAdminRulePage, { loadData as loadEditAdminRulePageData } from '@/pages/admin/EditAdminRulePage.tsx';
import EditAdminRuleViolationPage, { loadData as loadEditAdminRuleViolationPageData } from '@/pages/admin/EditAdminRuleViolationPage.tsx';
import AdminProfanityPage, { loadData as loadAdminProfanityPageData } from '@/pages/admin/AdminProfanityPage.tsx';
import AdminBoardPage, { loadData as loadAdminBoardPageData } from '@/pages/admin/AdminBoardPage.tsx';
import UserTicketDashboardPage, { loadData as loadUserTicketDashboardPageData } from '@/pages/admin/UserTicketDashboardPage.tsx';
import UserTicketPage, { loadData as loadUserTicketPageData } from '@/pages/admin/UserTicketPage.tsx';
import UserMatchingPage, { loadData as loadUserMatchingPageData } from './components/pages/admin/UserMatchingPage.tsx';
import SupportTicketDashboardPage, { loadData as loadSupportTicketDashboardPageData } from './components/pages/admin/SupportTicketDashboardPage.tsx';
import SupportTicketPage, { loadData as loadSupportTicketPageData } from './components/pages/admin/SupportTicketPage.tsx';
import AddSupportTicketPage, { loadData as loadAddSupportTicketPageData } from './components/pages/admin/AddSupportTicketPage.tsx';
import UserSessionsPage, { loadData as loadUserSessionsPageData } from './components/pages/admin/UserSessionsPage.tsx';
import UserSessionPage, { loadData as loadUserSessionPageData } from './components/pages/admin/UserSessionPage.tsx';
import SupportEmailDashboardPage, { loadData as loadSupportEmailDashboardPage } from '@/pages/admin/SupportEmailDashboardPage.tsx';
import SupportEmailPage, { loadData as loadSupportEmailPage } from '@/pages/admin/SupportEmailPage.tsx';
import SendSupportEmailPage from '@/pages/admin/SendSupportEmailPage.tsx';

import AutomationPage, { loadData as loadAutomationPageData } from '@/pages/automation/AutomationPage.tsx';

import COPPAPage from '@/pages/legal/COPPAPage.tsx';
import PrivacyPage from '@/pages/legal/PrivacyPage.tsx';
import SiteRulesPage, { loadData as loadSiteRulesPageData } from '@/pages/legal/SiteRulesPage.tsx';
import TOSPage from '@/pages/legal/TOSPage.tsx';
import PoliciesPage from '@/pages/legal/PoliciesPage.tsx';
import CookiePolicyPage from '@/pages/legal/CookiePolicyPage.tsx';
import FAQPage from '@/pages/FAQPage.tsx';
import CreditsPage from '@/pages/legal/CreditsPage.tsx';
import DonatePage from '@/pages/DonatePage.tsx';
import HonoraryCitizensPage, { loadData as loadHonoraryCitizensPageData } from '@/pages/HonoraryCitizensPage.tsx';
import DonatedPage from '@/pages/DonatedPage.tsx';
import TopBellsPage, { loadData as loadTopBellsPageData } from '@/pages/TopBellsPage.tsx';
import SiteStatisticsPage, { loadData as loadSiteStatisticsPageData } from '@/pages/SiteStatisticsPage.tsx';

import SettingsPage from '@/pages/settings/SettingsPage.tsx';
import AvatarSettingsPage, { loadData as loadAvatarSettingsPageData } from '@/pages/settings/AvatarSettingsPage.tsx';
import AccountSettingsPage, { loadData as loadAccountSettingsPageData } from '@/pages/settings/AccountSettingsPage.tsx';
import ForumSettingsPage, { loadData as loadForumSettingsPageData } from '@/pages/settings/ForumSettingsPage.tsx';
import EmojiSettingsPage, { loadData as loadEmojiSettingsPageData } from '@/pages/settings/EmojiSettingsPage.tsx';
import AvatarPage, { loadData as loadAvatarPageData } from '@/pages/avatar/AvatarPage.tsx';

import ProfilePage, { loadData as loadProfilePageData } from '@/pages/profile/ProfilePage.tsx';
import ProfileBioPage, { loadData as loadProfileBioPageData } from '@/pages/profile/ProfileBioPage.tsx';
import ProfileFriendCodesPage, { loadData as loadProfileFriendCodesPageData } from '@/pages/profile/ProfileFriendCodesPage.tsx';
import ProfileTownsPage from '@/pages/profile/ProfileTownsPage.tsx';
import ProfileAdminPage, { loadData as loadProfileAdminPageData } from '@/pages/profile/ProfileAdminPage.tsx';

import EditProfileBioPage, { loadData as loadEditProfileBioPageData } from '@/pages/profile/EditProfileBioPage.tsx';

import UserTownsPage, { loadData as loadUserTownsPageData } from '@/pages/town/UserTownsPage.tsx';
import EditTownPage, { loadData as loadEditTownPageData } from '@/pages/town/EditTownPage.tsx';
import AddTownPage, { loadData as loadAddTownPageData } from '@/pages/town/AddTownPage.tsx';
import EditCharacterPage, { loadData as loadEditCharacterPageData } from '@/pages/character/EditCharacterPage.tsx';
import AddCharacterPage, { loadData as loadAddCharacterPageData } from '@/pages/character/AddCharacterPage.tsx';
import MapMakerPage, { loadData as loadMapMakerPageData } from '@/pages/town/MapMakerPage.tsx';

import CatalogPage, { loadData as loadCatalogPageData } from '@/pages/user/CatalogPage.tsx';
import CharacterCatalogPage, { loadData as loadCharacterCatalogPageData } from '@/pages/character/CharacterCatalogPage.tsx';
import EditCharacterCatalogPage, { loadData as loadEditCharacterCatalogPageData } from '@/pages/character/EditCharacterCatalogPage.tsx';
import UserCatalogPage, { loadData as loadUserCatalogPageData } from '@/pages/user/UserCatalogPage.tsx';
import EditUserCatalogPage, { loadData as loadEditUserCatalogPageData } from '@/pages/user/EditUserCatalogPage.tsx';
import PCCatalogPage, { loadData as loadPCCatalogPageData } from '@/pages/user/PCCatalogPage.tsx';
import EditPCCatalogPage, { loadData as loadEditPCCatalogPageData } from '@/pages/user/EditPCCatalogPage.tsx';

import TunesPage, { loadData as loadTunesPageData } from '@/pages/tune/TunesPage.tsx';
import EditTunePage, { loadData as loadEditTunePageData } from '@/pages/tune/EditTunePage.tsx';
import EditTownTunePage, { loadData as loadEditTownTunePageData } from '@/pages/town/EditTownTunePage.tsx';
import ChooseTownTunePage, { loadData as loadChooseTownTunePageData } from '@/pages/tune/ChooseTownTunePage.tsx';
import AddTunePage from '@/pages/tune/AddTunePage.tsx';

import PatternsPage, { loadData as loadPatternsPageData } from '@/pages/pattern/PatternsPage.tsx';
import PatternPage, { loadData as loadPatternPageData } from '@/pages/pattern/PatternPage.tsx';
import EditPatternPage, { loadData as loadEditPatternPageData } from '@/pages/pattern/EditPatternPage.tsx';
import AddPatternPage, { loadData as loadAddPatternPageData } from '@/pages/pattern/AddPatternPage.tsx';
import ChooseTownFlagPage, { loadData as loadChooseTownFlagPageData } from '@/pages/pattern/ChooseTownFlagPage.tsx';

import FriendCodesPage, { loadData as loadFriendCodesPageData } from '@/pages/friend_code/FriendCodesPage.tsx';
import UserFriendCodesPage, { loadData as loadUserFriendCodesPageData } from '@/pages/friend_code/UserFriendCodesPage.tsx';
import EditFriendCodePage, { loadData as loadEditFriendCodePageData } from '@/pages/friend_code/EditFriendCodePage.tsx';
import AddFriendCodePage, { loadData as loadAddFriendCodePageData } from '@/pages/friend_code/AddFriendCodePage.tsx';
import UserReceivedRatingsPage, { loadData as loadUserReceivedRatingsPageData } from '@/pages/rating/UserReceivedRatingsPage.tsx';
import UserGivenRatingsPage, { loadData as loadUserGivenRatingsPageData } from '@/pages/rating/UserGivenRatingsPage.tsx';

import TradingPostPage, { loadData as loadTradingPostPageData } from '@/pages/trading_post/TradingPostPage.tsx';
import UserListingPage, { loadData as loadUserListingPageData } from '@/pages/trading_post/UserListingPage.tsx';
import AddListingPage, { loadData as loadAddListingPageData } from '@/pages/trading_post/AddListingPage.tsx';
import ListingPage, { loadData as loadListingPageData } from '@/pages/trading_post/ListingPage.tsx';
import AddOfferPage, { loadData as loadAddOfferPageData } from '@/pages/trading_post/AddOfferPage.tsx';

import FeaturesDashboardPage, { loadData as loadFeaturesDashboardPageData } from '@/pages/feature/FeaturesDashboardPage.tsx';
import FeaturePage, { loadData as loadFeaturePageData } from '@/pages/feature/FeaturePage.tsx';
import EditFeaturePage, { loadData as loadEditFeaturePageData } from '@/pages/feature/EditFeaturePage.tsx';
import AddFeaturePage, { loadData as loadAddFeaturePageData } from '@/pages/feature/AddFeaturePage.tsx';

import BuddyPage, { loadData as loadBuddyPageData } from '@/pages/user/BuddyPage.tsx';
import TicketsPage, { loadData as loadTicketsPageData } from '@/pages/user/TicketsPage.tsx';
import TicketPage, { loadData as loadTicketPageData } from '@/pages/user/TicketPage.tsx';

import GuidesPage, { loadData as loadGuidesPageData } from '@/pages/guide/GuidesPage.tsx';
import GuidePage, { loadData as loadGuidePageData } from '@/pages/guide/GuidePage.tsx';
import EditGuidePage, { loadData as loadEditGuidePageData } from '@/pages/guide/EditGuidePage.tsx';
import AddGuidePage, { loadData as loadAddGuidePageData } from '@/pages/guide/AddGuidePage.tsx';

import CalendarPage, { loadData as loadCalendarPageData } from '@/pages/CalendarPage.tsx';

import ScoutHubPage, { loadData as loadScoutHubPageData } from '@/pages/scout-hub/ScoutHubPage.tsx';
import NewMembersPage, { loadData as loadNewMembersPageData } from '@/pages/scout-hub/NewMembersPage.tsx';
import ReassignPage, { loadData as loadReassignPageData } from '@/pages/scout-hub/ReassignPage.tsx';
import ScoutSettingsPage, { loadData as loadScoutSettingsPageData } from '@/pages/scout-hub/ScoutSettingsPage.tsx';
import NewMemberPage from '@/pages/user/NewMemberPage.tsx';
import ScoutThreadBanner, { loadData as loadScoutThreadBannerData } from '@/pages/headers/ScoutThreadBanner.tsx';
import AdoptionThreadSettingsPage, { loadData as loadAdoptionThreadSettingsPageData } from '@/pages/scout-hub/AdoptionThreadSettingsPage.tsx';
import ScoutRatingsPage, { loadData as loadScoutRatingsPageData } from '@/pages/scout-hub/ScoutRatingsPage.tsx';

import BellShopPage, { loadData as loadBellShopPageData } from '@/pages/bell_shop/BellShopPage.tsx';
import BellShopGiftPage, { loadData as loadBellShopGiftPageData } from '@/pages/bell_shop/BellShopGiftPage.tsx';
import BellShopRedeemedPage, { loadData as loadBellShopRedeemedPageData } from '@/pages/bell_shop/BellShopRedeemedPage.tsx';

import SignupPage from '@/pages/signup/SignupPage.tsx';
import CongratsPage from '@/pages/signup/CongratsPage.tsx';
import ConsentNeededPage from '@/pages/signup/ConsentNeededPage.tsx';
import ConsentPage, { loadData as loadConsentPageData } from '@/pages/signup/ConsentPage.tsx';
import EmailNeededPage from '@/pages/signup/EmailNeededPage.tsx';

import ShopsPage, { loadData as loadShopsPageData } from '@/pages/shop/ShopsPage.tsx';
import ShopPage, { loadData as loadShopPageData } from '@/pages/shop/ShopPage.tsx';
import EditShopPage, { loadData as loadEditShopPageData } from '@/pages/shop/EditShopPage.tsx';
import AddShopPage, { loadData as loadAddShopPageData } from '@/pages/shop/AddShopPage.tsx';
import EmployeesPage, { loadData as loadEmployeesPageData } from '@/pages/shop/EmployeesPage.tsx';
import ServicesPage, { loadData as loadServicesPageData } from '@/pages/shop/ServicesPage.tsx';
import ShopThreadsPage, { loadData as loadShopThreadsPageData } from '@/pages/shop/ShopThreadsPage.tsx';
import ApplicationPage, { loadData as loadApplicationPageData } from '@/pages/shop/ApplicationPage.tsx';
import OrderPage, { loadData as loadOrderPageData } from '@/pages/shop/OrderPage.tsx';
import EmployeeRatingsPage, { loadData as loadEmployeeRatingsPageData } from '@/pages/shop/EmployeeRatingsPage.tsx';
import ShopThreadBanner, { loadData as loadShopThreadBannerData } from '@/pages/headers/ShopThreadBanner.tsx';

function _getLoaderFunction(loader:any, params:any, request:any)
{
	const searchParams = new URL(request.url).searchParams;

	return loader.bind({
		query: (iso as any).query.bind(null, request.session?.user),
		userId: null // impossible to tell frontend
	})(params, Object.fromEntries(searchParams.entries()))
	.then((data:any) => {
		return data;
	})
	.catch((error:any) =>
	{
		console.error('Logging route error:');
		console.error(error);

		// if you went directly to a page and you're not supposed to
		// have access to it, redirect to the main page
		if (error.name === 'UserError' && (error.identifiers.includes('permission') || error.identifiers.includes('login-needed')))
		{
			// prevent forever redirect
			if (request.url.endsWith('/'))
			{
				throw json(
					error,
					{ status: 400 }
				);
			}

			return redirect('/');
		}

		if (error.name === 'MaintenanceMode')
		{
			return redirectDocument('/');
		}

		// see api-requests.ts
		let status = 500, statusText = '';

		if (error.name === 'UserError' || error.name === 'ProfanityError')
		{
			status = 400;
			statusText = error.identifiers[0];
		}

		// Something went wrong fetching data, or possibly within React
		throw json(
			error,
			{ status, statusText }
		);
	});
}

// Used For: Catalog pages. Fast on prod, slow on test sites with no Redis.
async function deferLoaderFunction(loader:any, params:any, request:any)
{
	// Don't defer if we're loading from the server
	// Server will handle 'loading spinner' and this allows
	// the client side to have the data
	let shouldDefer = true;

	if (request.hasOwnProperty('session'))
	{
		shouldDefer = false;
	}

	const dataPromise = _getLoaderFunction(loader, params, request);
	const data = shouldDefer ? dataPromise : await dataPromise;

	return defer({data: data});
}

function LoadingFunction(WrappedComponent:any)
{
	return <Loading><WrappedComponent /></Loading>;
}

type RouteProps = {
	params: any
	request: any
}

const routes = [
	{
		path: '/',
		element: <App />,
		loader: async ({ params, request }: RouteProps) => _getLoaderFunction(loadAppData, params, request),
		errorElement: <RouteError />,
		shouldRevalidate: () => true,
		children: [
			{
				path: '',
				element: <HomePage />,
				loader: async ({ params, request }: RouteProps) => _getLoaderFunction(loadHomePageData, params, request)
			},
			{
				path: 'admin',
				element: <AdminHomePage />
			},
			{
				path: 'admin/permissions',
				element: <AdminPermissionsPage />,
				loader: async ({ params, request }: RouteProps) => _getLoaderFunction(loadAdminPermissionsPageData, params, request)
			},
			{
				path: 'admin/permissions/:id',
				element: <AdminPermissionsPage />,
				loader: async ({ params, request }: RouteProps) => _getLoaderFunction(loadAdminPermissionsPageData, params, request)
			},
			{
				path: 'admin/game-consoles',
				element: <AdminGameConsolesPage />,
				loader: async ({ params, request }: RouteProps) => _getLoaderFunction(loadAdminGameConsolesPageData, params, request)
			},
			{
				path: 'admin/game-console/add',
				element: <AddAdminGameConsolePage />,
				loader: async ({ params, request }: RouteProps) => _getLoaderFunction(loadAddAdminGameConsolePageData, params, request)
			},
			{
				path: 'admin/game-console/:id',
				element: <AdminGamesPage />,
				loader: async ({ params, request }: RouteProps) => _getLoaderFunction(loadAdminGamesPageData, params, request)
			},
			{
				path: 'admin/game-console/:id/edit',
				element: <EditAdminGameConsolePage />,
				loader: async ({ params, request }: RouteProps) => _getLoaderFunction(loadEditAdminGameConsolePageData, params, request)
			},
			{
				path: 'admin/game-console/:id/add-game',
				element: <AddAdminGamePage />,
				loader: async ({ params, request }: RouteProps) => _getLoaderFunction(loadAddAdminGamePageData, params, request)
			},
			{
				path: 'admin/game/:id/edit',
				element: <EditAdminGamePage />,
				loader: async ({ params, request }: RouteProps) => _getLoaderFunction(loadEditAdminGamePageData, params, request)
			},
			{
				path: 'admin/weekly-polls',
				element: <AdminWeeklyPollsPage />,
				loader: async ({ params, request }: RouteProps) => _getLoaderFunction(loadAdminWeeklyPollsPageData, params, request)
			},
			{
				path: 'admin/weekly-polls/:type',
				element: <AdminWeeklyPollsPage />,
				loader: async ({ params, request }: RouteProps) => _getLoaderFunction(loadAdminWeeklyPollsPageData, params, request)
			},
			{
				path: 'admin/weekly-poll/:id/edit',
				element: <EditWeeklyPollPage />,
				loader: async ({ params, request }: RouteProps) => _getLoaderFunction(loadEditWeeklyPollPageData, params, request)
			},
			{
				path: 'admin/weekly-poll/add',
				element: <AddWeeklyPollPage />
			},
			{
				path: 'rules',
				element: <AdminRulesPage />,
				loader: async ({ params, request }: RouteProps) => _getLoaderFunction(loadAdminRulesPageData, params, request)
			},
			{
				path: 'admin/rules/add',
				element: <AddAdminRulePage />,
				loader: async ({ params, request }: RouteProps) => _getLoaderFunction(loadAddAdminRulePageData, params, request)
			},
			{
				path: 'admin/rules/:ruleId',
				element: <EditAdminRulePage />,
				loader: async ({ params, request }: RouteProps) => _getLoaderFunction(loadEditAdminRulePageData, params, request)
			},
			{
				path: 'admin/rules/:ruleId/add',
				element: <AddAdminRuleViolationPage />,
				loader: async ({ params, request }: RouteProps) => _getLoaderFunction(loadAddAdminRuleViolationPageData, params, request)
			},
			{
				path: 'admin/rules/:ruleId/:violationId',
				element: <EditAdminRuleViolationPage />,
				loader: async ({ params, request }: RouteProps) => _getLoaderFunction(loadEditAdminRuleViolationPageData, params, request)
			},
			{
				path: 'profanity',
				element: <AdminProfanityPage />,
				loader: async ({ params, request }: RouteProps) => _getLoaderFunction(loadAdminProfanityPageData, params, request)
			},
			{
				path: 'admin/board',
				element: <AdminBoardPage />,
				loader: async ({ params, request }: RouteProps) => _getLoaderFunction(loadAdminBoardPageData, params, request)
			},
			{
				path: 'modmin',
				element: <ModminHomePage />
			},
			{
				path: 'automation',
				element: <AutomationPage />,
				loader: async ({ params, request }: RouteProps) => _getLoaderFunction(loadAutomationPageData, params, request)
			},
			{
				path: 'forums',
				loader: async () => {
					return redirect(`/forums/${encodeURIComponent(constants.boardIds.accForums)}`);
				}
			},
			{
				path: 'boards.asp',
				loader: async () => {
					return redirect(`/forums/${encodeURIComponent(constants.boardIds.accForums)}`);
				}
			},
			{
				path: 'forums/:id',
				element: <NodePage />,
				loader: async ({ params, request }: RouteProps) => _getLoaderFunction(loadNodePageData, params, request)
			},
			{
				path: 'forums/:id/history',
				element: <NodeHistoryPage />,
				loader: async ({ params, request }: RouteProps) => _getLoaderFunction(loadNodeHistoryPageData, params, request)
			},
			{
				path: 'forums/:id/:page',
				element: <NodePage />,
				loader: async ({ params, request }: RouteProps) => _getLoaderFunction(loadNodePageData, params, request)
			},
			{
				path: 'Topic/:id/:page',
				loader: async ({ params, request }: RouteProps) => {
					return redirect(`/forums/${encodeURIComponent(params.id)}/${encodeURIComponent(params.page)}`);
				}
			},
			{
				path: 'Topic/:id/:page/:title',
				loader: async ({ params, request }: RouteProps) => {
					return redirect(`/forums/${encodeURIComponent(params.id)}/${encodeURIComponent(params.page)}`);
				}
			},
			{
				path: 'forums/:id/:page/:editId',
				element: <NodePage />,
				loader: async ({ params, request }: RouteProps) => _getLoaderFunction(loadNodePageData, params, request)
			},
			{
				path: 'followed/:type',
				element: <FollowedNodePage />,
				loader: async ({ params, request }: RouteProps) => _getLoaderFunction(loadFollowedNodePageData, params, request)
			},
			{
				path: 'threads/:userId',
				element: <ThreadsPage />,
				loader: async ({ params, request }: RouteProps) => _getLoaderFunction(loadThreadsPageData, params, request)
			},
			{
				path: 'settings',
				element: <SettingsPage />,
				children: [
					{
						path: '',
						element: <AccountSettingsPage />,
						loader: async ({ params, request }: RouteProps) => _getLoaderFunction(loadAccountSettingsPageData, params, request)
					},
					{
						path: 'avatar',
						element: <AvatarSettingsPage />,
						loader: async ({ params, request }: RouteProps) => _getLoaderFunction(loadAvatarSettingsPageData, params, request)
					},
					{
						path: 'forum',
						element: <ForumSettingsPage />,
						loader: async ({ params, request }: RouteProps) => _getLoaderFunction(loadForumSettingsPageData, params, request)
					},
					{
						path: 'emoji',
						element: <EmojiSettingsPage />,
						loader: async ({ params, request }: RouteProps) => _getLoaderFunction(loadEmojiSettingsPageData, params, request)
					},
				]
			},
			// note these links hardcoded on SiteContent for accepting TOS
			{
				path: 'legal/coppa',
				element: <COPPAPage />
			},
			{
				path: 'legal/privacy',
				element: <PrivacyPage />
			},
			{
				path: 'legal/terms',
				element: <TOSPage />
			},
			{
				path: 'legal/policies',
				element: <PoliciesPage />
			},
			{
				path: 'legal/cookies',
				element: <CookiePolicyPage />
			},
			{
				path: 'faq',
				element: <FAQPage />
			},
			{
				path: 'credits',
				element: <CreditsPage />
			},
			{
				path: 'menu',
				element: <SitemapPage />
			},
			{
				path: 'staff',
				element: <StaffPage />,
				loader: async ({ params, request }: RouteProps) => _getLoaderFunction(loadStaffPageData, params, request)
			},
			{
				path: 'staff-roles',
				element: <StaffRolesPage />,
				loader: async ({ params, request }: RouteProps) => _getLoaderFunction(loadStaffRolesPageData, params, request)
			},
			{
				path: 'staff-roles/:id',
				element: <StaffRolesPage />,
				loader: async ({ params, request }: RouteProps) => _getLoaderFunction(loadStaffRolesPageData, params, request)
			},
			{
				path: 'guidelines',
				element: <SiteRulesPage />,
				loader: async ({ params, request }: RouteProps) => _getLoaderFunction(loadSiteRulesPageData, params, request)
			},
			{
				path: 'profile/:id',
				element: <ProfilePage />,
				loader: async ({ params, request }: RouteProps) => {
					// id can be id, or the username
					// we need to redirect to the id url so links works
					if (isNaN(params.id))
					{
						return await (iso as any).query(null, 'v1/user_lite', {username: params.id})
							.then((data:UserLiteType) =>
							{
								return redirect(`/profile/${encodeURIComponent(data.id)}`);
							})
							.catch((error:any) =>
							{
								console.error('Throwing profile route error:');
								console.error(error);

								// see api-requests.ts
								let status = 500;

								if (error.name === 'UserError' || error.name === 'ProfanityError')
								{
									status = 400;
								}

								throw json(
									error,
									{ status: status }
								);
							})
					}
					else
					{
						return _getLoaderFunction(loadProfilePageData, params, request);
					}
				},
				children: [
					{
						path: '',
						element: <ProfileBioPage />,
						loader: async ({ params, request }: RouteProps) => _getLoaderFunction(loadProfileBioPageData, params, request)
					},
					{
						path: 'edit',
						element: <EditProfileBioPage />,
						loader: async ({ params, request }: RouteProps) => _getLoaderFunction(loadEditProfileBioPageData, params, request)
					},
					{
						path: 'friend-codes',
						element: <ProfileFriendCodesPage />,
						loader: async ({ params, request }: RouteProps) => _getLoaderFunction(loadProfileFriendCodesPageData, params, request),
						children: [
							{
								path: '',
								element: <UserFriendCodesPage />,
								loader: async ({ params, request }: RouteProps) => _getLoaderFunction(loadUserFriendCodesPageData, params, request)
							}
						]
					},
					{
						path: 'friend-code/add',
						element: <ProfileFriendCodesPage />,
						loader: async ({ params, request }: RouteProps) => _getLoaderFunction(loadProfileFriendCodesPageData, params, request),
						children: [
							{
								path: '',
								element: <AddFriendCodePage />,
								loader: async ({ params, request }: RouteProps) => _getLoaderFunction(loadAddFriendCodePageData, params, request)
							}
						]
					},
					{
						path: 'friend-code/:friendCodeId/edit',
						element: <ProfileFriendCodesPage />,
						loader: async ({ params, request }: RouteProps) => _getLoaderFunction(loadProfileFriendCodesPageData, params, request),
						children: [
							{
								path: '',
								element: <EditFriendCodePage />,
								loader: async ({ params, request }: RouteProps) => _getLoaderFunction(loadEditFriendCodePageData, params, request)
							}
						]
					},
					{
						path: 'towns',
						element: <ProfileTownsPage />,
						children: [
							{
								path: '',
								element: LoadingFunction(UserTownsPage),
								loader: async ({ params, request }: RouteProps) => deferLoaderFunction(loadUserTownsPageData, params, request)
							},
							{
								path: 'add',
								element: <AddTownPage />,
								loader: async ({ params, request }: RouteProps) => _getLoaderFunction(loadAddTownPageData, params, request)
							},
							{
								path: 'add/:gameId',
								element: <AddTownPage />,
								loader: async ({ params, request }: RouteProps) => _getLoaderFunction(loadAddTownPageData, params, request)
							}
						]
					},
					{
						path: 'town/:townId/edit',
						element: <ProfileTownsPage />,
						children: [
							{
								path: '',
								element: <EditTownPage />,
								loader: async ({ params, request }: RouteProps) => _getLoaderFunction(loadEditTownPageData, params, request)
							}
						]
					},
					{
						path: 'town/:townId/map',
						element: <ProfileTownsPage />,
						children: [
							{
								path: '',
								element: <MapMakerPage />,
								loader: async ({ params, request }: RouteProps) => _getLoaderFunction(loadMapMakerPageData, params, request)
							}
						]
					},
					{
						path: 'town/:townId/tune',
						element: <ProfileTownsPage />,
						children: [
							{
								path: '',
								element: <EditTownTunePage />,
								loader: async ({ params, request }: RouteProps) => _getLoaderFunction(loadEditTownTunePageData, params, request)
							}
						]
					},
					{
						path: 'characters/add',
						element: <ProfileTownsPage />,
						children: [
							{
								path: '',
								element: <AddCharacterPage />,
								loader: async ({ params, request }: RouteProps) => _getLoaderFunction(loadAddCharacterPageData, params, request)
							},
							{
								path: ':townId',
								element: <AddCharacterPage />,
								loader: async ({ params, request }: RouteProps) => _getLoaderFunction(loadAddCharacterPageData, params, request)
							}
						]
					},
					{
						path: 'character/:characterId/edit',
						element: <ProfileTownsPage />,
						children: [
							{
								path: '',
								element: <EditCharacterPage />,
								loader: async ({ params, request }: RouteProps) => _getLoaderFunction(loadEditCharacterPageData, params, request)
							}
						]
					},
					{
						path: 'security',
						element: <ProfileAdminPage />,
						loader: async ({ params, request }: RouteProps) => _getLoaderFunction(loadProfileAdminPageData, params, request)
					},
				]
			},
			{
				path: 'town-tune/:id/edit',
				element: <EditTunePage />,
				loader: async ({ params, request }: RouteProps) => _getLoaderFunction(loadEditTunePageData, params, request)
			},
			{
				path: 'town-tune/:id/choose',
				element: <ChooseTownTunePage />,
				loader: async ({ params, request }: RouteProps) => _getLoaderFunction(loadChooseTownTunePageData, params, request)
			},
			{
				path: 'town-tunes',
				element: <TunesPage />,
				loader: async ({ params, request }: RouteProps) => _getLoaderFunction(loadTunesPageData, params, request)
			},
			{
				path: 'town-tunes/add',
				element: <AddTunePage />
			},
			{
				path: 'pattern/:id',
				element: <PatternPage />,
				loader: async ({ params, request }: RouteProps) => _getLoaderFunction(loadPatternPageData, params, request)
			},
			{
				path: 'pattern/:id/edit',
				element: <EditPatternPage />,
				loader: async ({ params, request }: RouteProps) => _getLoaderFunction(loadEditPatternPageData, params, request)
			},
			{
				path: 'pattern/:id/choose',
				element: <ChooseTownFlagPage />,
				loader: async ({ params, request }: RouteProps) => _getLoaderFunction(loadChooseTownFlagPageData, params, request)
			},
			{
				path: 'patterns',
				element: <PatternsPage />,
				loader: async ({ params, request }: RouteProps) => _getLoaderFunction(loadPatternsPageData, params, request)
			},
			{
				path: 'patterns.asp',
				loader: async () => {
					return redirect(`/patterns`);
				}
			},
			{
				path: 'patterns/add',
				element: <AddPatternPage />,
				loader: async ({ params, request }: RouteProps) => _getLoaderFunction(loadAddPatternPageData, params, request)
			},
			{
				path: 'catalog/:userId',
				element: <CatalogPage />,
				loader: async ({ params, request }: RouteProps) => _getLoaderFunction(loadCatalogPageData, params, request),
				children: [
					{
						path: 'user',
						element: LoadingFunction(UserCatalogPage),
						loader: async ({ params, request }: RouteProps) => deferLoaderFunction(loadUserCatalogPageData, params, request)
					},
					{
						path: 'user/edit',
						element: <EditUserCatalogPage />,
						loader: async ({ params, request }: RouteProps) => _getLoaderFunction(loadEditUserCatalogPageData, params, request)
					},
					{
						path: 'pc',
						element: LoadingFunction(PCCatalogPage),
						loader: async ({ params, request }: RouteProps) => deferLoaderFunction(loadPCCatalogPageData, params, request)
					},
					{
						path: 'pc/edit',
						element: <EditPCCatalogPage />,
						loader: async ({ params, request }: RouteProps) => _getLoaderFunction(loadEditPCCatalogPageData, params, request)
					},
					{
						path: 'character/:characterId',
						element: <CharacterCatalogPage />,
						loader: async ({ params, request }: RouteProps) => _getLoaderFunction(loadCharacterCatalogPageData, params, request)
					},
					{
						path: 'character/:characterId/edit',
						element: <EditCharacterCatalogPage />,
						loader: async ({ params, request }: RouteProps) => _getLoaderFunction(loadEditCharacterCatalogPageData, params, request)
					}
				]
			},
			{
				path: 'friend-codes',
				element: <FriendCodesPage />,
				loader: async ({ params, request }: RouteProps) => _getLoaderFunction(loadFriendCodesPageData, params, request)
			},
			{
				path: 'ratings/:userId/:type',
				element: <UserReceivedRatingsPage />,
				loader: async ({ params, request }: RouteProps) => _getLoaderFunction(loadUserReceivedRatingsPageData, params, request)
			},
			{
				path: 'ratings/:userId/:type/given',
				element: <UserGivenRatingsPage />,
				loader: async ({ params, request }: RouteProps) => _getLoaderFunction(loadUserGivenRatingsPageData, params, request)
			},
			{
				path: 'trading-post',
				element: <TradingPostPage />,
				loader: async ({ params, request }: RouteProps) => _getLoaderFunction(loadTradingPostPageData, params, request)
			},
			{
				path: 'tp_home.asp',
				loader: async () => {
					return redirect(`/trading-post`);
				}
			},
			{
				path: 'trading-post/:userId/all',
				element: LoadingFunction(UserListingPage),
				loader: async ({ params, request }: RouteProps) => deferLoaderFunction(loadUserListingPageData, params, request)
			},
			{
				path: 'trading-post/add',
				element: <AddListingPage />,
				loader: async ({ params, request }: RouteProps) => _getLoaderFunction(loadAddListingPageData, params, request)
			},
			{
				path: 'trading-post/add/:type',
				element: <AddListingPage />,
				loader: async ({ params, request }: RouteProps) => _getLoaderFunction(loadAddListingPageData, params, request)
			},
			{
				path: 'trading-post/add/:type/:gameId',
				element: <AddListingPage />,
				loader: async ({ params, request }: RouteProps) => _getLoaderFunction(loadAddListingPageData, params, request)
			},
			{
				path: 'trading-post/:id',
				element: <ListingPage />,
				loader: async ({ params, request }: RouteProps) => _getLoaderFunction(loadListingPageData, params, request)
			},
			{
				path: 'trading-post/:id/offer',
				element: <AddOfferPage />,
				loader: async ({ params, request }: RouteProps) => _getLoaderFunction(loadAddOfferPageData, params, request)
			},
			{
				path: 'features',
				element: <FeaturesDashboardPage />,
				loader: async ({ params, request }: RouteProps) => _getLoaderFunction(loadFeaturesDashboardPageData, params, request)
			},
			{
				path: 'feature/:id',
				element: <FeaturePage />,
				loader: async ({ params, request }: RouteProps) => _getLoaderFunction(loadFeaturePageData, params, request)
			},
			{
				path: 'feature/:id/edit',
				element: <EditFeaturePage />,
				loader: async ({ params, request }: RouteProps) => _getLoaderFunction(loadEditFeaturePageData, params, request)
			},
			{
				path: 'features/add',
				element: <AddFeaturePage />,
				loader: async ({ params, request }: RouteProps) => _getLoaderFunction(loadAddFeaturePageData, params, request)
			},
			{
				path: 'buddies',
				element: <BuddyPage />,
				loader: async ({ params, request }: RouteProps) => _getLoaderFunction(loadBuddyPageData, params, request)
			},
			{
				path: 'guides',
				element: <GuidesPage />,
				loader: async ({ params, request }: RouteProps) => _getLoaderFunction(loadGuidesPageData, params, request)
			},
			{
				path: 'guides/:gameId',
				element: <GuidesPage />,
				loader: async ({ params, request }: RouteProps) => _getLoaderFunction(loadGuidesPageData, params, request)
			},
			{
				path: 'guides/:gameId/add',
				element: <AddGuidePage />,
				loader: async ({ params, request }: RouteProps) => _getLoaderFunction(loadAddGuidePageData, params, request)
			},
			{
				path: 'guide/:id',
				element: <GuidePage />,
				loader: async ({ params, request }: RouteProps) => _getLoaderFunction(loadGuidePageData, params, request)
			},
			{
				path: 'guide/:id/edit',
				element: <EditGuidePage />,
				loader: async ({ params, request }: RouteProps) => _getLoaderFunction(loadEditGuidePageData, params, request)
			},
			{
				path: 'calendar',
				element: <CalendarPage />,
				loader: async ({ params, request }: RouteProps) => _getLoaderFunction(loadCalendarPageData, params, request)
			},
			{
				path: 'user-tickets',
				element: <UserTicketDashboardPage />,
				loader: async ({ params, request }: RouteProps) => _getLoaderFunction(loadUserTicketDashboardPageData, params, request)
			},
			{
				path: 'user-ticket/:id',
				element: <UserTicketPage />,
				loader: async ({ params, request }: RouteProps) => _getLoaderFunction(loadUserTicketPageData, params, request)
			},
			{
				path: 'support-emails',
				element: <SupportEmailDashboardPage />,
				loader: async ({ params, request }: RouteProps) => _getLoaderFunction(loadSupportEmailDashboardPage, params, request)
			},
			{
				path: 'support-emails/send',
				element: <SendSupportEmailPage />
			},
			{
				path: 'support-email/:id',
				element: <SupportEmailPage />,
				loader: async ({ params, request }: RouteProps) => _getLoaderFunction(loadSupportEmailPage, params, request)
			},
			{
				path: 'tickets',
				element: <TicketsPage />,
				loader: async ({ params, request }: RouteProps) => _getLoaderFunction(loadTicketsPageData, params, request)
			},
			{
				path: 'ticket/:id',
				element: <TicketPage />,
				loader: async ({ params, request }: RouteProps) => _getLoaderFunction(loadTicketPageData, params, request)
			},
			{
				path: 'scout-hub',
				element: <ScoutHubPage />,
				loader: async ({ params, request }: RouteProps) => _getLoaderFunction(loadScoutHubPageData, params, request)
			},
			{
				path: 'scout-hub/adoption/settings',
				element: <AdoptionThreadSettingsPage />,
				loader: async ({ params, request }: RouteProps) => _getLoaderFunction(loadAdoptionThreadSettingsPageData, params, request)
			},
			{
				path: 'scout-hub/adoption/:id',
				element: <ScoutThreadBanner />,
				loader: async ({ params, request }: RouteProps) => _getLoaderFunction(loadScoutThreadBannerData, params, request),
				children: [
					{
						path: '',
						element: <NodePage />,
						loader: async ({ params, request }: RouteProps) => _getLoaderFunction(loadNodePageData, params, request)
					},
					{
						path: ':page',
						element: <NodePage />,
						loader: async ({ params, request }: RouteProps) => _getLoaderFunction(loadNodePageData, params, request)
					},
					{
						path: ':page/:editId',
						element: <NodePage />,
						loader: async ({ params, request }: RouteProps) => _getLoaderFunction(loadNodePageData, params, request)
					},
				]
			},
			{
				path: 'scout-hub/new-members',
				element: <NewMembersPage />,
				loader: async ({ params, request }: RouteProps) => _getLoaderFunction(loadNewMembersPageData, params, request)
			},
			{
				path: 'scout-hub/new-members/reassign/:adopteeId',
				element: <ReassignPage />,
				loader: async ({ params, request }: RouteProps) => _getLoaderFunction(loadReassignPageData, params, request)
			},
			{
				path: 'scout-hub/settings',
				element: <ScoutSettingsPage />,
				loader: async ({ params, request }: RouteProps) => _getLoaderFunction(loadScoutSettingsPageData, params, request)
			},
			{
				path: 'scout-hub/ratings/:userId',
				element: <ScoutRatingsPage />,
				loader: async ({ params, request }: RouteProps) => _getLoaderFunction(loadScoutRatingsPageData, params, request)
			},
			{
				path: 'new-member',
				element: <NewMemberPage />
			},
			{
				path: 'user-matching',
				element: <UserMatchingPage />,
				loader: async ({ params, request }: RouteProps) => _getLoaderFunction(loadUserMatchingPageData, params, request)
			},
			{
				path: 'notifications',
				element: <NotificationsPage />,
				loader: async ({ params, request }: RouteProps) => _getLoaderFunction(loadNotificationsPageData, params, request)
			},
			{
				path: 'honorary-citizens',
				element: <HonoraryCitizensPage />,
				loader: async ({ params, request }: RouteProps) => _getLoaderFunction(loadHonoraryCitizensPageData, params, request)
			},
			{
				path: 'donate',
				element: <DonatePage />
			},
			{
				path: 'donated',
				element: <DonatedPage />
			},
			{
				path: 'top-bells',
				element: <TopBellsPage />,
				loader: async ({ params, request }: RouteProps) => _getLoaderFunction(loadTopBellsPageData, params, request)
			},
			{
				path: 'bell-shop',
				element: <BellShopPage />,
				loader: async ({ params, request }: RouteProps) => _getLoaderFunction(loadBellShopPageData, params, request)
			},
			{
				path: 'bell-shop/:id/gift',
				element: <BellShopGiftPage />,
				loader: async ({ params, request }: RouteProps) => _getLoaderFunction(loadBellShopGiftPageData, params, request)
			},
			{
				path: 'bell-shop/redeemed',
				element: <BellShopRedeemedPage />,
				loader: async ({ params, request }: RouteProps) => _getLoaderFunction(loadBellShopRedeemedPageData, params, request)
			},
			{
				path: 'bell-shop/:categoryId',
				element: <BellShopPage />,
				loader: async ({ params, request }: RouteProps) => _getLoaderFunction(loadBellShopPageData, params, request)
			},
			{
				path: 'support-tickets',
				element: <SupportTicketDashboardPage />,
				loader: async ({ params, request }: RouteProps) => _getLoaderFunction(loadSupportTicketDashboardPageData, params, request)
			},
			{
				path: 'support-tickets/add',
				element: <AddSupportTicketPage />,
				loader: async ({ params, request }: RouteProps) => _getLoaderFunction(loadAddSupportTicketPageData, params, request)
			},
			{
				path: 'support-ticket/:id',
				element: <SupportTicketPage />,
				loader: async ({ params, request }: RouteProps) => _getLoaderFunction(loadSupportTicketPageData, params, request)
			},
			{
				path: 'user-sessions',
				element: <UserSessionsPage />,
				loader: async ({ params, request }: RouteProps) => _getLoaderFunction(loadUserSessionsPageData, params, request)
			},
			{
				path: 'user-session/:id',
				element: <UserSessionPage />,
				loader: async ({ params, request }: RouteProps) => _getLoaderFunction(loadUserSessionPageData, params, request)
			},
			{
				path: 'sign-up',
				element: <SignupPage />
			},
			{
				path: 'congrats',
				element: <CongratsPage />
			},
			{
				path: 'consent-needed/:id',
				element: <ConsentNeededPage />
			},
			{
				path: 'consent/:id',
				element: <ConsentPage />,
				loader: async ({ params, request }: RouteProps) => _getLoaderFunction(loadConsentPageData, params, request)
			},
			{
				path: 'email-needed/:id',
				element: <EmailNeededPage />
			},
			{
				path: 'site-statistics',
				element: <SiteStatisticsPage />,
				loader: async ({ params, request }: RouteProps) => _getLoaderFunction(loadSiteStatisticsPageData, params, request)
			},
			{
				path: 'leaving',
				element: <LeavingSitePage />,
				loader: async ({ params, request }: RouteProps) => {
					const searchParams = new URL(request.url).search;
					const url = searchParams.substring(5);

					if (url && constants.approvedURLs.find(au => url.startsWith(au)))
					{
						return redirect(url);
					}

					return null;
				}
			},
			{
				path: 'avatars',
				element: <AvatarPage />,
				loader: async ({ params, request }: RouteProps) => _getLoaderFunction(loadAvatarPageData, params, request)
			},
			{
				path: 'shops',
				element: <ShopsPage />,
				loader: async ({ params, request }: RouteProps) => _getLoaderFunction(loadShopsPageData, params, request)
			},
			{
				path: 'shop/:id',
				element: LoadingFunction(ShopPage),
				loader: async ({ params, request }: RouteProps) => deferLoaderFunction(loadShopPageData, params, request)
			},
			{
				path: 'shop/:id/edit',
				element: LoadingFunction(EditShopPage),
				loader: async ({ params, request }: RouteProps) => deferLoaderFunction(loadEditShopPageData, params, request)
			},
			{
				path: 'shops/add',
				element: <AddShopPage />,
				loader: async ({ params, request }: RouteProps) => _getLoaderFunction(loadAddShopPageData, params, request)
			},
			{
				path: 'shop/:id/employees',
				element: <EmployeesPage />,
				loader: async ({ params, request }: RouteProps) => _getLoaderFunction(loadEmployeesPageData, params, request)
			},
			{
				path: 'shop/:id/services',
				element: <ServicesPage />,
				loader: async ({ params, request }: RouteProps) => _getLoaderFunction(loadServicesPageData, params, request)
			},
			{
				path: 'shops/threads',
				element: <ShopThreadsPage />,
				loader: async ({ params, request }: RouteProps) => _getLoaderFunction(loadShopThreadsPageData, params, request)
			},
			{
				path: 'shop/application/:id',
				element: <ApplicationPage />,
				loader: async ({ params, request }: RouteProps) => _getLoaderFunction(loadApplicationPageData, params, request)
			},
			{
				path: 'shop/order/:id',
				element: <OrderPage />,
				loader: async ({ params, request }: RouteProps) => _getLoaderFunction(loadOrderPageData, params, request)
			},
			{
				path: 'shops/ratings/:userId',
				element: <EmployeeRatingsPage />,
				loader: async ({ params, request }: RouteProps) => _getLoaderFunction(loadEmployeeRatingsPageData, params, request)
			},
			{
				path: 'shops/threads/:id',
				element: <ShopThreadBanner />,
				loader: async ({ params, request }: RouteProps) => _getLoaderFunction(loadShopThreadBannerData, params, request),
				children: [
					{
						path: '',
						element: <NodePage />,
						loader: async ({ params, request }: RouteProps) => _getLoaderFunction(loadNodePageData, params, request)
					},
					{
						path: ':page',
						element: <NodePage />,
						loader: async ({ params, request }: RouteProps) => _getLoaderFunction(loadNodePageData, params, request)
					},
					{
						path: ':page/:editId',
						element: <NodePage />,
						loader: async ({ params, request }: RouteProps) => _getLoaderFunction(loadNodePageData, params, request)
					},
				]
			},
		],
	},
];

export default routes;
