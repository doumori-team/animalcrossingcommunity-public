import React from 'react';
import { redirect, json, defer } from 'react-router-dom';
import * as iso from 'common/iso.js';

import { constants } from '@utils';

import App, { loadData as loadAppData } from './components/App.js';
import RouteError from '@/pages/RouteError.js';
import Loading from './components/layout/Loading.js';
import LeavingSitePage from '@/pages/LeavingSitePage.js';

import FollowedNodePage, { loadData as loadFollowedNodePageData } from '@/pages/FollowedNodePage.js';
import ThreadsPage, { loadData as loadThreadsPageData } from '@/pages/ThreadsPage.js';
import HomePage, { loadData as loadHomePageData } from '@/pages/HomePage.js';
import NodePage, { loadData as loadNodePageData } from '@/pages/NodePage.js';
import NodeHistoryPage, { loadData as loadNodeHistoryPageData } from '@/pages/NodeHistoryPage.js';
import SitemapPage from '@/pages/SitemapPage.js';
import StaffPage, { loadData as loadStaffPageData } from '@/pages/StaffPage.js';
import StaffRolesPage, { loadData as loadStaffRolesPageData } from '@/pages/StaffRolesPage.js';
import NotificationsPage, { loadData as loadNotificationsPageData } from '@/pages/NotificationsPage.js';

import AdminHomePage from '@/pages/admin/AdminHomePage.js';
import ModminHomePage from '@/pages/admin/ModminHomePage.js';
import AdminPermissionsPage, { loadData as loadAdminPermissionsPageData } from '@/pages/admin/AdminPermissionsPage.js';
import AdminGameConsolesPage, { loadData as loadAdminGameConsolesPageData } from '@/pages/admin/AdminGameConsolesPage.js';
import AdminGamesPage, { loadData as loadAdminGamesPageData } from '@/pages/admin/AdminGamesPage.js';
import AddAdminGameConsolePage, { loadData as loadAddAdminGameConsolePageData } from '@/pages/admin/AddAdminGameConsolePage.js';
import AddAdminGamePage, { loadData as loadAddAdminGamePageData } from '@/pages/admin/AddAdminGamePage.js';
import EditAdminGameConsolePage, { loadData as loadEditAdminGameConsolePageData } from '@/pages/admin/EditAdminGameConsolePage.js';
import EditAdminGamePage, { loadData as loadEditAdminGamePageData } from '@/pages/admin/EditAdminGamePage.js';
import AdminWeeklyPollsPage, { loadData as loadAdminWeeklyPollsPageData } from '@/pages/admin/AdminWeeklyPollsPage.js';
import AddWeeklyPollPage from '@/pages/admin/AddWeeklyPollPage.js';
import EditWeeklyPollPage, { loadData as loadEditWeeklyPollPageData } from '@/pages/admin/EditWeeklyPollPage.js';
import AdminRulesPage, { loadData as loadAdminRulesPageData } from '@/pages/admin/AdminRulesPage.js';
import AddAdminRulePage, { loadData as loadAddAdminRulePageData } from '@/pages/admin/AddAdminRulePage.js';
import AddAdminRuleViolationPage, { loadData as loadAddAdminRuleViolationPageData } from '@/pages/admin/AddAdminRuleViolationPage.js';
import EditAdminRulePage, { loadData as loadEditAdminRulePageData } from '@/pages/admin/EditAdminRulePage.js';
import EditAdminRuleViolationPage, { loadData as loadEditAdminRuleViolationPageData } from '@/pages/admin/EditAdminRuleViolationPage.js';
import AdminProfanityPage, { loadData as loadAdminProfanityPageData } from '@/pages/admin/AdminProfanityPage.js';
import AdminBoardPage, { loadData as loadAdminBoardPageData } from '@/pages/admin/AdminBoardPage.js';
import UserTicketDashboardPage, { loadData as loadUserTicketDashboardPageData } from '@/pages/admin/UserTicketDashboardPage.js';
import UserTicketPage, { loadData as loadUserTicketPageData } from '@/pages/admin/UserTicketPage.js';
import UserMatchingPage, { loadData as loadUserMatchingPageData } from './components/pages/admin/UserMatchingPage.js';
import SupportTicketDashboardPage, { loadData as loadSupportTicketDashboardPageData } from './components/pages/admin/SupportTicketDashboardPage.js';
import SupportTicketPage, { loadData as loadSupportTicketPageData } from './components/pages/admin/SupportTicketPage.js';
import AddSupportTicketPage, { loadData as loadAddSupportTicketPageData } from './components/pages/admin/AddSupportTicketPage.js';
import UserSessionsPage, { loadData as loadUserSessionsPageData } from './components/pages/admin/UserSessionsPage.js';
import UserSessionPage, { loadData as loadUserSessionPageData } from './components/pages/admin/UserSessionPage.js';
import SupportEmailDashboardPage, { loadData as loadSupportEmailDashboardPage } from '@/pages/admin/SupportEmailDashboardPage.js';
import SupportEmailPage, { loadData as loadSupportEmailPage } from '@/pages/admin/SupportEmailPage.js';
import SendSupportEmailPage from '@/pages/admin/SendSupportEmailPage.js';

import AutomationPage, { loadData as loadAutomationPageData } from '@/pages/automation/AutomationPage.js';

import COPPAPage from '@/pages/legal/COPPAPage.js';
import PrivacyPage from '@/pages/legal/PrivacyPage.js';
import SiteRulesPage, { loadData as loadSiteRulesPageData } from '@/pages/legal/SiteRulesPage.js';
import TOSPage from '@/pages/legal/TOSPage.js';
import PoliciesPage from '@/pages/legal/PoliciesPage.js';
import CookiePolicyPage from '@/pages/legal/CookiePolicyPage.js';
import FAQPage from '@/pages/FAQPage.js';
import CreditsPage from '@/pages/legal/CreditsPage.js';
import DonatePage from '@/pages/DonatePage.js';
import HonoraryCitizensPage, { loadData as loadHonoraryCitizensPageData } from '@/pages/HonoraryCitizensPage.js';
import DonatedPage from '@/pages/DonatedPage.js';
import TopBellsPage, { loadData as loadTopBellsPageData } from '@/pages/TopBellsPage.js';
import SiteStatisticsPage, { loadData as loadSiteStatisticsPageData } from '@/pages/SiteStatisticsPage.js';

import SettingsPage from '@/pages/settings/SettingsPage.js';
import AvatarSettingsPage, { loadData as loadAvatarSettingsPageData } from '@/pages/settings/AvatarSettingsPage.js';
import AccountSettingsPage, { loadData as loadAccountSettingsPageData } from '@/pages/settings/AccountSettingsPage.js';
import ForumSettingsPage, { loadData as loadForumSettingsPageData } from '@/pages/settings/ForumSettingsPage.js';
import EmojiSettingsPage, { loadData as loadEmojiSettingsPageData } from '@/pages/settings/EmojiSettingsPage.js';
import AvatarPage, { loadData as loadAvatarPageData } from '@/pages/avatar/AvatarPage.js';

import ProfilePage, { loadData as loadProfilePageData } from '@/pages/profile/ProfilePage.js';
import ProfileBioPage, { loadData as loadProfileBioPageData } from '@/pages/profile/ProfileBioPage.js';
import ProfileFriendCodesPage from '@/pages/profile/ProfileFriendCodesPage.js';
import ProfileTownsPage from '@/pages/profile/ProfileTownsPage.js';
import ProfileAdminPage, { loadData as loadProfileAdminPageData } from '@/pages/profile/ProfileAdminPage.js';

import EditProfileBioPage, { loadData as loadEditProfileBioPageData } from '@/pages/profile/EditProfileBioPage.js';

import UserTownsPage, { loadData as loadUserTownsPageData } from '@/pages/town/UserTownsPage.js';
import EditTownPage, { loadData as loadEditTownPageData } from '@/pages/town/EditTownPage.js';
import AddTownPage, { loadData as loadAddTownPageData } from '@/pages/town/AddTownPage.js';
import EditCharacterPage, { loadData as loadEditCharacterPageData } from '@/pages/character/EditCharacterPage.js';
import AddCharacterPage, { loadData as loadAddCharacterPageData } from '@/pages/character/AddCharacterPage.js';
import MapMakerPage, { loadData as loadMapMakerPageData } from '@/pages/town/MapMakerPage.js';

import CatalogPage, { loadData as loadCatalogPageData } from '@/pages/user/CatalogPage.js';
import CharacterCatalogPage, { loadData as loadCharacterCatalogPageData } from '@/pages/character/CharacterCatalogPage.js';
import EditCharacterCatalogPage, { loadData as loadEditCharacterCatalogPageData } from '@/pages/character/EditCharacterCatalogPage.js';
import UserCatalogPage, { loadData as loadUserCatalogPageData } from '@/pages/user/UserCatalogPage.js';
import EditUserCatalogPage, { loadData as loadEditUserCatalogPageData } from '@/pages/user/EditUserCatalogPage.js';
import PCCatalogPage, { loadData as loadPCCatalogPageData } from '@/pages/user/PCCatalogPage.js';
import EditPCCatalogPage, { loadData as loadEditPCCatalogPageData } from '@/pages/user/EditPCCatalogPage.js';

import TunesPage, { loadData as loadTunesPageData } from '@/pages/tune/TunesPage.js';
import EditTunePage, { loadData as loadEditTunePageData } from '@/pages/tune/EditTunePage.js';
import EditTownTunePage, { loadData as loadEditTownTunePageData } from '@/pages/town/EditTownTunePage.js';
import ChooseTownTunePage, { loadData as loadChooseTownTunePageData } from '@/pages/tune/ChooseTownTunePage.js';
import AddTunePage from '@/pages/tune/AddTunePage.js';

import PatternsPage, { loadData as loadPatternsPageData } from '@/pages/pattern/PatternsPage.js';
import PatternPage, { loadData as loadPatternPageData } from '@/pages/pattern/PatternPage.js';
import EditPatternPage, { loadData as loadEditPatternPageData } from '@/pages/pattern/EditPatternPage.js';
import AddPatternPage, { loadData as loadAddPatternPageData } from '@/pages/pattern/AddPatternPage.js';
import ChooseTownFlagPage, { loadData as loadChooseTownFlagPageData } from '@/pages/pattern/ChooseTownFlagPage.js';
import EditTownFlagPage, { loadData as loadEditTownFlagPageData } from '@/pages/town/EditTownFlagPage.js';

import FriendCodesPage, { loadData as loadFriendCodesPageData } from '@/pages/friend_code/FriendCodesPage.js';
import UserFriendCodesPage, { loadData as loadUserFriendCodesPageData } from '@/pages/friend_code/UserFriendCodesPage.js';
import EditFriendCodePage, { loadData as loadEditFriendCodePageData } from '@/pages/friend_code/EditFriendCodePage.js';
import AddFriendCodePage, { loadData as loadAddFriendCodePageData } from '@/pages/friend_code/AddFriendCodePage.js';
import UserReceivedRatingsPage, { loadData as loadUserReceivedRatingsPageData } from '@/pages/rating/UserReceivedRatingsPage.js';
import UserGivenRatingsPage, { loadData as loadUserGivenRatingsPageData } from '@/pages/rating/UserGivenRatingsPage.js';

import TradingPostPage, { loadData as loadTradingPostPageData } from '@/pages/trading_post/TradingPostPage.js';
import UserListingPage, { loadData as loadUserListingPageData } from '@/pages/trading_post/UserListingPage.js';
import AddListingPage, { loadData as loadAddListingPageData } from '@/pages/trading_post/AddListingPage.js';
import ListingPage, { loadData as loadListingPageData } from '@/pages/trading_post/ListingPage.js';
import AddOfferPage, { loadData as loadAddOfferPageData } from '@/pages/trading_post/AddOfferPage.js';

import FeaturesDashboardPage, { loadData as loadFeaturesDashboardPageData } from '@/pages/feature/FeaturesDashboardPage.js';
import FeaturePage, { loadData as loadFeaturePageData } from '@/pages/feature/FeaturePage.js';
import EditFeaturePage, { loadData as loadEditFeaturePageData } from '@/pages/feature/EditFeaturePage.js';
import AddFeaturePage, { loadData as loadAddFeaturePageData } from '@/pages/feature/AddFeaturePage.js';

import BuddyPage, { loadData as loadBuddyPageData } from '@/pages/user/BuddyPage.js';
import TicketsPage, { loadData as loadTicketsPageData } from '@/pages/user/TicketsPage.js';
import TicketPage, { loadData as loadTicketPageData } from '@/pages/user/TicketPage.js';

import GuidesPage, { loadData as loadGuidesPageData } from '@/pages/guide/GuidesPage.js';
import GuidePage, { loadData as loadGuidePageData } from '@/pages/guide/GuidePage.js';
import EditGuidePage, { loadData as loadEditGuidePageData } from '@/pages/guide/EditGuidePage.js';
import AddGuidePage, { loadData as loadAddGuidePageData } from '@/pages/guide/AddGuidePage.js';

import CalendarPage, { loadData as loadCalendarPageData } from '@/pages/CalendarPage.js';

import ScoutHubPage, { loadData as loadScoutHubPageData } from '@/pages/scout-hub/ScoutHubPage.js';
import NewMembersPage, { loadData as loadNewMembersPageData } from '@/pages/scout-hub/NewMembersPage.js';
import ReassignPage, { loadData as loadReassignPageData } from '@/pages/scout-hub/ReassignPage.js';
import ScoutSettingsPage, { loadData as loadScoutSettingsPageData } from '@/pages/scout-hub/ScoutSettingsPage.js';
import NewMemberPage from '@/pages/user/NewMemberPage.js';
import ScoutThreadBanner, { loadData as loadScoutThreadBannerData } from '@/pages/headers/ScoutThreadBanner.js';
import AdoptionThreadSettingsPage, { loadData as loadAdoptionThreadSettingsPageData } from '@/pages/scout-hub/AdoptionThreadSettingsPage.js';
import ScoutRatingsPage, { loadData as loadScoutRatingsPageData } from '@/pages/scout-hub/ScoutRatingsPage.js';

import BellShopPage, { loadData as loadBellShopPageData } from '@/pages/bell_shop/BellShopPage.js';
import BellShopRedeemedPage, { loadData as loadBellShopRedeemedPageData } from '@/pages/bell_shop/BellShopRedeemedPage.js';

import SignupPage from '@/pages/signup/SignupPage.js';
import CongratsPage from '@/pages/signup/CongratsPage.js';
import ConsentNeededPage from '@/pages/signup/ConsentNeededPage.js';
import ConsentPage, { loadData as loadConsentPageData } from '@/pages/signup/ConsentPage.js';
import EmailNeededPage from '@/pages/signup/EmailNeededPage.js';

function paramsToObject(entries)
{
	let result = {};

	for (const [key, value] of entries)
	{
		if (key in result)
		{
			if (Array.isArray(result[key]))
			{
				result[key].push(value);
			}
			else
			{
				result[key] = [result[key], value];
			}
		}
		else
		{
			result[key] = value;
		}
	}

	return result;
}

function _getLoaderFunction(loader, params, request)
{
	const searchParams = new URL(request.url).searchParams;

	return loader.bind({query: iso.query.bind(null, request.session?.user)})(params, paramsToObject(searchParams.entries()))
	.then(data => {
		return data;
	})
	.catch(error =>
	{
		console.error('Logging route error:');
		console.error(error);

		// if you went directly to a page and you're not supposed to
		// have access to it, redirect to the main page
		if (error.name === 'UserError' && (error.identifiers.includes('permission') || error.identifiers.includes('login-needed')))
		{
			return redirect('/');
		}

		// see api-requests.js
		let status = 500;

		if (error.name === 'UserError' || error.name === 'ProfanityError')
		{
			status = 400;
		}

		// Something went wrong fetching data, or possibly within React
		throw json(
			error,
			{ status: status }
		);
	});
}

async function deferLoaderFunction(loader, params, request)
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

function LoadingFunction(WrappedComponent)
{
	return <Loading><WrappedComponent /></Loading>;
}

const routes = [
	{
		path: '/',
		element: <App />,
		loader: async ({ params, request }) => _getLoaderFunction(loadAppData, params, request),
		errorElement: <RouteError />,
		shouldRevalidate: () => true,
		children: [
			{
				path: '',
				element: <HomePage />,
				loader: async ({ params, request }) => _getLoaderFunction(loadHomePageData, params, request)
			},
			{
				path: 'admin',
				element: <AdminHomePage />
			},
			{
				path: 'admin/permissions',
				element: LoadingFunction(AdminPermissionsPage),
				loader: async ({ params, request }) => deferLoaderFunction(loadAdminPermissionsPageData, params, request)
			},
			{
				path: 'admin/permissions/:id',
				element: LoadingFunction(AdminPermissionsPage),
				loader: async ({ params, request }) => deferLoaderFunction(loadAdminPermissionsPageData, params, request)
			},
			{
				path: 'admin/game-consoles',
				element: <AdminGameConsolesPage />,
				loader: async ({ params, request }) => _getLoaderFunction(loadAdminGameConsolesPageData, params, request)
			},
			{
				path: 'admin/game-console/add',
				element: <AddAdminGameConsolePage />,
				loader: async ({ params, request }) => _getLoaderFunction(loadAddAdminGameConsolePageData, params, request)
			},
			{
				path: 'admin/game-console/:id',
				element: <AdminGamesPage />,
				loader: async ({ params, request }) => _getLoaderFunction(loadAdminGamesPageData, params, request)
			},
			{
				path: 'admin/game-console/:id/edit',
				element: <EditAdminGameConsolePage />,
				loader: async ({ params, request }) => _getLoaderFunction(loadEditAdminGameConsolePageData, params, request)
			},
			{
				path: 'admin/game-console/:id/add-game',
				element: <AddAdminGamePage />,
				loader: async ({ params, request }) => _getLoaderFunction(loadAddAdminGamePageData, params, request)
			},
			{
				path: 'admin/game/:id/edit',
				element: <EditAdminGamePage />,
				loader: async ({ params, request }) => _getLoaderFunction(loadEditAdminGamePageData, params, request)
			},
			{
				path: 'admin/weekly-polls',
				element: <AdminWeeklyPollsPage />,
				loader: async ({ params, request }) => _getLoaderFunction(loadAdminWeeklyPollsPageData, params, request)
			},
			{
				path: 'admin/weekly-polls/:type',
				element: <AdminWeeklyPollsPage />,
				loader: async ({ params, request }) => _getLoaderFunction(loadAdminWeeklyPollsPageData, params, request)
			},
			{
				path: 'admin/weekly-poll/:id/edit',
				element: <EditWeeklyPollPage />,
				loader: async ({ params, request }) => _getLoaderFunction(loadEditWeeklyPollPageData, params, request)
			},
			{
				path: 'admin/weekly-poll/add',
				element: <AddWeeklyPollPage />
			},
			{
				path: 'rules',
				element: <AdminRulesPage />,
				loader: async ({ params, request }) => _getLoaderFunction(loadAdminRulesPageData, params, request)
			},
			{
				path: 'admin/rules/add',
				element: <AddAdminRulePage />,
				loader: async ({ params, request }) => _getLoaderFunction(loadAddAdminRulePageData, params, request)
			},
			{
				path: 'admin/rules/:ruleId',
				element: <EditAdminRulePage />,
				loader: async ({ params, request }) => _getLoaderFunction(loadEditAdminRulePageData, params, request)
			},
			{
				path: 'admin/rules/:ruleId/add',
				element: <AddAdminRuleViolationPage />,
				loader: async ({ params, request }) => _getLoaderFunction(loadAddAdminRuleViolationPageData, params, request)
			},
			{
				path: 'admin/rules/:ruleId/:violationId',
				element: <EditAdminRuleViolationPage />,
				loader: async ({ params, request }) => _getLoaderFunction(loadEditAdminRuleViolationPageData, params, request)
			},
			{
				path: 'profanity',
				element: <AdminProfanityPage />,
				loader: async ({ params, request }) => _getLoaderFunction(loadAdminProfanityPageData, params, request)
			},
			{
				path: 'admin/board',
				element: <AdminBoardPage />,
				loader: async ({ params, request }) => _getLoaderFunction(loadAdminBoardPageData, params, request)
			},
			{
				path: 'modmin',
				element: <ModminHomePage />
			},
			{
				path: 'automation',
				element: <AutomationPage />,
				loader: async ({ params, request }) => _getLoaderFunction(loadAutomationPageData, params, request)
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
				element: LoadingFunction(NodePage),
				loader: async ({ params, request }) => deferLoaderFunction(loadNodePageData, params, request)
			},
			{
				path: 'forums/:id/history',
				element: <NodeHistoryPage />,
				loader: async ({ params, request }) => _getLoaderFunction(loadNodeHistoryPageData, params, request)
			},
			{
				path: 'forums/:id/:page',
				element: LoadingFunction(NodePage),
				loader: async ({ params, request }) => deferLoaderFunction(loadNodePageData, params, request)
			},
			{
				path: 'Topic/:id/:page',
				loader: async ({ params }) => {
					return redirect(`/forums/${encodeURIComponent(params.id)}/${encodeURIComponent(params.page)}`);
				}
			},
			{
				path: 'Topic/:id/:page/:title',
				loader: async ({ params }) => {
					return redirect(`/forums/${encodeURIComponent(params.id)}/${encodeURIComponent(params.page)}`);
				}
			},
			{
				path: 'forums/:id/:page/:editId',
				element: LoadingFunction(NodePage),
				loader: async ({ params, request }) => deferLoaderFunction(loadNodePageData, params, request)
			},
			{
				path: 'followed/:type',
				element: LoadingFunction(FollowedNodePage),
				loader: async ({ params, request }) => deferLoaderFunction(loadFollowedNodePageData, params, request)
			},
			{
				path: 'threads/:userId',
				element: LoadingFunction(ThreadsPage),
				loader: async ({ params, request }) => deferLoaderFunction(loadThreadsPageData, params, request)
			},
			{
				path: 'settings',
				element: <SettingsPage />,
				children: [
					{
						path: '',
						element: <AccountSettingsPage />,
						loader: async ({ params, request }) => _getLoaderFunction(loadAccountSettingsPageData, params, request)
					},
					{
						path: 'avatar',
						element: LoadingFunction(AvatarSettingsPage),
						loader: async ({ params, request }) => deferLoaderFunction(loadAvatarSettingsPageData, params, request)
					},
					{
						path: 'forum',
						element: <ForumSettingsPage />,
						loader: async ({ params, request }) => _getLoaderFunction(loadForumSettingsPageData, params, request)
					},
					{
						path: 'emoji',
						element: <EmojiSettingsPage />,
						loader: async ({ params, request }) => _getLoaderFunction(loadEmojiSettingsPageData, params, request)
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
				loader: async ({ params, request }) => _getLoaderFunction(loadStaffPageData, params, request)
			},
			{
				path: 'staff-roles',
				element: <StaffRolesPage />,
				loader: async ({ params, request }) => _getLoaderFunction(loadStaffRolesPageData, params, request)
			},
			{
				path: 'staff-roles/:id',
				element: <StaffRolesPage />,
				loader: async ({ params, request }) => _getLoaderFunction(loadStaffRolesPageData, params, request)
			},
			{
				path: 'guidelines',
				element: <SiteRulesPage />,
				loader: async ({ params, request }) => _getLoaderFunction(loadSiteRulesPageData, params, request)
			},
			{
				path: 'profile/:id',
				element: <ProfilePage />,
				loader: async ({ params, request }) => {
					// id can be id, or the username
					// we need to redirect to the id url so links works
					if (isNaN(params.id))
					{
						return await iso.query(null, 'v1/user_lite', {username: params.id})
							.then(data =>
							{
								return redirect(`/profile/${encodeURIComponent(data.id)}`);
							})
							.catch(error =>
							{
								throw json(
									error,
									{ status: 500 }
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
						loader: async ({ params, request }) => _getLoaderFunction(loadProfileBioPageData, params, request)
					},
					{
						path: 'edit',
						element: <EditProfileBioPage />,
						loader: async ({ params, request }) => _getLoaderFunction(loadEditProfileBioPageData, params, request)
					},
					{
						path: 'friend-codes',
						element: <ProfileFriendCodesPage />,
						children: [
							{
								path: '',
								element: <UserFriendCodesPage />,
								loader: async ({ params, request }) => _getLoaderFunction(loadUserFriendCodesPageData, params, request)
							}
						]
					},
					{
						path: 'friend-code/add',
						element: <ProfileFriendCodesPage />,
						children: [
							{
								path: '',
								element: <AddFriendCodePage />,
								loader: async ({ params, request }) => _getLoaderFunction(loadAddFriendCodePageData, params, request)
							}
						]
					},
					{
						path: 'friend-code/:friendCodeId/edit',
						element: <ProfileFriendCodesPage />,
						children: [
							{
								path: '',
								element: <EditFriendCodePage />,
								loader: async ({ params, request }) => _getLoaderFunction(loadEditFriendCodePageData, params, request)
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
								loader: async ({ params, request }) => deferLoaderFunction(loadUserTownsPageData, params, request)
							},
							{
								path: 'add',
								element: <AddTownPage />,
								loader: async ({ params, request }) => _getLoaderFunction(loadAddTownPageData, params, request)
							},
							{
								path: 'add/:gameId',
								element: <AddTownPage />,
								loader: async ({ params, request }) => _getLoaderFunction(loadAddTownPageData, params, request)
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
								loader: async ({ params, request }) => _getLoaderFunction(loadEditTownPageData, params, request)
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
								loader: async ({ params, request }) => _getLoaderFunction(loadMapMakerPageData, params, request)
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
								loader: async ({ params, request }) => _getLoaderFunction(loadEditTownTunePageData, params, request)
							}
						]
					},
					{
						path: 'town/:townId/pattern',
						element: <ProfileTownsPage />,
						children: [
							{
								path: '',
								element: <EditTownFlagPage />,
								loader: async ({ params, request }) => _getLoaderFunction(loadEditTownFlagPageData, params, request)
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
								loader: async ({ params, request }) => _getLoaderFunction(loadAddCharacterPageData, params, request)
							},
							{
								path: ':townId',
								element: <AddCharacterPage />,
								loader: async ({ params, request }) => _getLoaderFunction(loadAddCharacterPageData, params, request)
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
								loader: async ({ params, request }) => _getLoaderFunction(loadEditCharacterPageData, params, request)
							}
						]
					},
					{
						path: 'security',
						element: LoadingFunction(ProfileAdminPage),
						loader: async ({ params, request }) => deferLoaderFunction(loadProfileAdminPageData, params, request)
					},
				]
			},
			{
				path: 'town-tune/:id/edit',
				element: <EditTunePage />,
				loader: async ({ params, request }) => _getLoaderFunction(loadEditTunePageData, params, request)
			},
			{
				path: 'town-tune/:id/choose',
				element: <ChooseTownTunePage />,
				loader: async ({ params, request }) => _getLoaderFunction(loadChooseTownTunePageData, params, request)
			},
			{
				path: 'town-tunes',
				element: <TunesPage />,
				loader: async ({ params, request }) => _getLoaderFunction(loadTunesPageData, params, request)
			},
			{
				path: 'town-tunes/add',
				element: <AddTunePage />
			},
			{
				path: 'pattern/:id',
				element: <PatternPage />,
				loader: async ({ params, request }) => _getLoaderFunction(loadPatternPageData, params, request)
			},
			{
				path: 'pattern/:id/edit',
				element: <EditPatternPage />,
				loader: async ({ params, request }) => _getLoaderFunction(loadEditPatternPageData, params, request)
			},
			{
				path: 'pattern/:id/choose',
				element: <ChooseTownFlagPage />,
				loader: async ({ params, request }) => _getLoaderFunction(loadChooseTownFlagPageData, params, request)
			},
			{
				path: 'patterns',
				element: LoadingFunction(PatternsPage),
				loader: async ({ params, request }) => deferLoaderFunction(loadPatternsPageData, params, request)
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
				loader: async ({ params, request }) => _getLoaderFunction(loadAddPatternPageData, params, request)
			},
			{
				path: 'catalog/:userId',
				element: <CatalogPage />,
				loader: async ({ params, request }) => _getLoaderFunction(loadCatalogPageData, params, request),
				children: [
					{
						path: 'user',
						element: LoadingFunction(UserCatalogPage),
						loader: async ({ params, request }) => deferLoaderFunction(loadUserCatalogPageData, params, request)
					},
					{
						path: 'user/edit',
						element: <EditUserCatalogPage />,
						loader: async ({ params, request }) => _getLoaderFunction(loadEditUserCatalogPageData, params, request)
					},
					{
						path: 'pc',
						element: LoadingFunction(PCCatalogPage),
						loader: async ({ params, request }) => deferLoaderFunction(loadPCCatalogPageData, params, request)
					},
					{
						path: 'pc/edit',
						element: <EditPCCatalogPage />,
						loader: async ({ params, request }) => _getLoaderFunction(loadEditPCCatalogPageData, params, request)
					},
					{
						path: 'character/:characterId',
						element: <CharacterCatalogPage />,
						loader: async ({ params, request }) => _getLoaderFunction(loadCharacterCatalogPageData, params, request)
					},
					{
						path: 'character/:characterId/edit',
						element: <EditCharacterCatalogPage />,
						loader: async ({ params, request }) => _getLoaderFunction(loadEditCharacterCatalogPageData, params, request)
					}
				]
			},
			{
				path: 'friend-codes',
				element: <FriendCodesPage />,
				loader: async ({ params, request }) => _getLoaderFunction(loadFriendCodesPageData, params, request)
			},
			{
				path: 'ratings/:userId/:type',
				element: <UserReceivedRatingsPage />,
				loader: async ({ params, request }) => _getLoaderFunction(loadUserReceivedRatingsPageData, params, request)
			},
			{
				path: 'ratings/:userId/:type/given',
				element: <UserGivenRatingsPage />,
				loader: async ({ params, request }) => _getLoaderFunction(loadUserGivenRatingsPageData, params, request)
			},
			{
				path: 'trading-post',
				element: LoadingFunction(TradingPostPage),
				loader: async ({ params, request }) => deferLoaderFunction(loadTradingPostPageData, params, request)
			},
			{
				path: 'tp_home.asp',
				loader: async () => {
					return redirect(`/trading-post`);
				}
			},
			{
				path: 'trading-post/:userId/all',
				element: <UserListingPage />,
				loader: async ({ params, request }) => _getLoaderFunction(loadUserListingPageData, params, request)
			},
			{
				path: 'trading-post/add',
				element: <AddListingPage />,
				loader: async ({ params, request }) => _getLoaderFunction(loadAddListingPageData, params, request)
			},
			{
				path: 'trading-post/add/:type',
				element: <AddListingPage />,
				loader: async ({ params, request }) => _getLoaderFunction(loadAddListingPageData, params, request)
			},
			{
				path: 'trading-post/add/:type/:gameId',
				element: <AddListingPage />,
				loader: async ({ params, request }) => _getLoaderFunction(loadAddListingPageData, params, request)
			},
			{
				path: 'trading-post/:id',
				element: <ListingPage />,
				loader: async ({ params, request }) => _getLoaderFunction(loadListingPageData, params, request)
			},
			{
				path: 'trading-post/:id/offer',
				element: <AddOfferPage />,
				loader: async ({ params, request }) => _getLoaderFunction(loadAddOfferPageData, params, request)
			},
			{
				path: 'features',
				element: <FeaturesDashboardPage />,
				loader: async ({ params, request }) => _getLoaderFunction(loadFeaturesDashboardPageData, params, request)
			},
			{
				path: 'feature/:id',
				element: <FeaturePage />,
				loader: async ({ params, request }) => _getLoaderFunction(loadFeaturePageData, params, request)
			},
			{
				path: 'feature/:id/edit',
				element: <EditFeaturePage />,
				loader: async ({ params, request }) => _getLoaderFunction(loadEditFeaturePageData, params, request)
			},
			{
				path: 'features/add',
				element: <AddFeaturePage />,
				loader: async ({ params, request }) => _getLoaderFunction(loadAddFeaturePageData, params, request)
			},
			{
				path: 'buddies',
				element: <BuddyPage />,
				loader: async ({ params, request }) => _getLoaderFunction(loadBuddyPageData, params, request)
			},
			{
				path: 'guides',
				element: <GuidesPage />,
				loader: async ({ params, request }) => _getLoaderFunction(loadGuidesPageData, params, request)
			},
			{
				path: 'guides/:gameId',
				element: <GuidesPage />,
				loader: async ({ params, request }) => _getLoaderFunction(loadGuidesPageData, params, request)
			},
			{
				path: 'guides/:gameId/add',
				element: <AddGuidePage />,
				loader: async ({ params, request }) => _getLoaderFunction(loadAddGuidePageData, params, request)
			},
			{
				path: 'guide/:id',
				element: <GuidePage />,
				loader: async ({ params, request }) => _getLoaderFunction(loadGuidePageData, params, request)
			},
			{
				path: 'guide/:id/edit',
				element: <EditGuidePage />,
				loader: async ({ params, request }) => _getLoaderFunction(loadEditGuidePageData, params, request)
			},
			{
				path: 'calendar',
				element: <CalendarPage />,
				loader: async ({ params, request }) => _getLoaderFunction(loadCalendarPageData, params, request)
			},
			{
				path: 'user-tickets',
				element: <UserTicketDashboardPage />,
				loader: async ({ params, request }) => _getLoaderFunction(loadUserTicketDashboardPageData, params, request)
			},
			{
				path: 'user-ticket/:id',
				element: <UserTicketPage />,
				loader: async ({ params, request }) => _getLoaderFunction(loadUserTicketPageData, params, request)
			},
			{
				path: 'support-emails',
				element: <SupportEmailDashboardPage />,
				loader: async ({ params, request }) => _getLoaderFunction(loadSupportEmailDashboardPage, params, request)
			},
			{
				path: 'support-emails/send',
				element: <SendSupportEmailPage />
			},
			{
				path: 'support-email/:id',
				element: <SupportEmailPage />,
				loader: async ({ params, request }) => _getLoaderFunction(loadSupportEmailPage, params, request)
			},
			{
				path: 'tickets',
				element: <TicketsPage />,
				loader: async ({ params, request }) => _getLoaderFunction(loadTicketsPageData, params, request)
			},
			{
				path: 'ticket/:id',
				element: <TicketPage />,
				loader: async ({ params, request }) => _getLoaderFunction(loadTicketPageData, params, request)
			},
			{
				path: 'scout-hub',
				element: <ScoutHubPage />,
				loader: async ({ params, request }) => _getLoaderFunction(loadScoutHubPageData, params, request)
			},
			{
				path: 'scout-hub/adoption/settings',
				element: <AdoptionThreadSettingsPage />,
				loader: async ({ params, request }) => _getLoaderFunction(loadAdoptionThreadSettingsPageData, params, request)
			},
			{
				path: 'scout-hub/adoption/:id',
				element: <ScoutThreadBanner />,
				loader: async ({ params, request }) => _getLoaderFunction(loadScoutThreadBannerData, params, request),
				children: [
					{
						path: '',
						element: LoadingFunction(NodePage),
						loader: async ({ params, request }) => deferLoaderFunction(loadNodePageData, params, request)
					},
					{
						path: ':page',
						element: LoadingFunction(NodePage),
						loader: async ({ params, request }) => deferLoaderFunction(loadNodePageData, params, request)
					},
				]
			},
			{
				path: 'scout-hub/new-members',
				element: <NewMembersPage />,
				loader: async ({ params, request }) => _getLoaderFunction(loadNewMembersPageData, params, request)
			},
			{
				path: 'scout-hub/new-members/reassign/:adopteeId',
				element: <ReassignPage />,
				loader: async ({ params, request }) => _getLoaderFunction(loadReassignPageData, params, request)
			},
			{
				path: 'scout-hub/settings',
				element: <ScoutSettingsPage />,
				loader: async ({ params, request }) => _getLoaderFunction(loadScoutSettingsPageData, params, request)
			},
			{
				path: 'scout-hub/ratings/:userId',
				element: <ScoutRatingsPage />,
				loader: async ({ params, request }) => _getLoaderFunction(loadScoutRatingsPageData, params, request)
			},
			{
				path: 'new-member',
				element: <NewMemberPage />
			},
			{
				path: 'user-matching',
				element: <UserMatchingPage />,
				loader: async ({ params, request }) => _getLoaderFunction(loadUserMatchingPageData, params, request)
			},
			{
				path: 'notifications',
				element: <NotificationsPage />,
				loader: async ({ params, request }) => _getLoaderFunction(loadNotificationsPageData, params, request)
			},
			{
				path: 'honorary-citizens',
				element: <HonoraryCitizensPage />,
				loader: async ({ params, request }) => _getLoaderFunction(loadHonoraryCitizensPageData, params, request)
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
				loader: async ({ params, request }) => _getLoaderFunction(loadTopBellsPageData, params, request)
			},
			{
				path: 'bell-shop',
				element: <BellShopPage />,
				loader: async ({ params, request }) => _getLoaderFunction(loadBellShopPageData, params, request)
			},
			{
				path: 'bell-shop/redeemed',
				element: <BellShopRedeemedPage />,
				loader: async ({ params, request }) => _getLoaderFunction(loadBellShopRedeemedPageData, params, request)
			},
			{
				path: 'bell-shop/:categoryId',
				element: <BellShopPage />,
				loader: async ({ params, request }) => _getLoaderFunction(loadBellShopPageData, params, request)
			},
			{
				path: 'support-tickets',
				element: <SupportTicketDashboardPage />,
				loader: async ({ params, request }) => _getLoaderFunction(loadSupportTicketDashboardPageData, params, request)
			},
			{
				path: 'support-tickets/add',
				element: <AddSupportTicketPage />,
				loader: async ({ params, request }) => _getLoaderFunction(loadAddSupportTicketPageData, params, request)
			},
			{
				path: 'support-ticket/:id',
				element: <SupportTicketPage />,
				loader: async ({ params, request }) => _getLoaderFunction(loadSupportTicketPageData, params, request)
			},
			{
				path: 'user-sessions',
				element: <UserSessionsPage />,
				loader: async ({ params, request }) => _getLoaderFunction(loadUserSessionsPageData, params, request)
			},
			{
				path: 'user-session/:id',
				element: <UserSessionPage />,
				loader: async ({ params, request }) => _getLoaderFunction(loadUserSessionPageData, params, request)
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
				loader: async ({ params, request }) => _getLoaderFunction(loadConsentPageData, params, request)
			},
			{
				path: 'email-needed/:id',
				element: <EmailNeededPage />
			},
			{
				path: 'site-statistics',
				element: <SiteStatisticsPage />,
				loader: async ({ params, request }) => _getLoaderFunction(loadSiteStatisticsPageData, params, request)
			},
			{
				path: 'leaving',
				element: <LeavingSitePage />,
				loader: async ({ params, request }) => {
					const searchParams = new URL(request.url).searchParams;
					const url = searchParams.get('url');

					if (url && (url.startsWith('/') || url.startsWith(constants.SITE_URL) || url.startsWith('http://newsletter.animalcrossingcommunity.com') || url.startsWith('http://financial.animalcrossingcommunity.com') || url.startsWith('http://www.animalcrossingcommunity.com') || url.startsWith('https://animalcrossingcommunity.s3.amazonaws.com')))
					{
						return redirect(url);
					}

					return null;
				}
			},
			{
				path: 'avatars',
				element: <AvatarPage />,
				loader: async ({ params, request }) => _getLoaderFunction(loadAvatarPageData, params, request)
			},
		],
	},
];

export default routes;
