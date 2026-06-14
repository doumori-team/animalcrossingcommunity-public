// This file is for any constants that are useful throughout the site.
// No dependencies should be added.

const isServer = typeof window === 'undefined';

const appName = isServer
	? process.env.VITE_APP_NAME
	: import.meta.env.VITE_APP_NAME;

export const LIVE_SITE = appName === 'animalcrossingcommunity';

export const SITE_URL = LIVE_SITE ? 'https://www.animalcrossingcommunity.com' : appName === 'acc-local' ? 'http://localhost:3000' : appName === 'animalcrossingcommunity-staging' ? 'https://staging.animalcrossingcommunity.com' : `https://${appName}.fly.dev`;

export const WS_URL = LIVE_SITE ? 'www.animalcrossingcommunity.com' : appName === 'acc-local' ? 'localhost:3000' : appName === 'animalcrossingcommunity-staging' ? 'https://staging.animalcrossingcommunity.com' : `${appName}.fly.dev`;

export const AWS_URL = 'https://cdn-s3.animalcrossingcommunity.com';

export const USER_FILE_DIR = LIVE_SITE ? `${AWS_URL}/images/users/` : `${AWS_URL}/images/stage/users/`;

export const USER_FILE_DIR2 = LIVE_SITE ? `images/users/` : `images/stage/users/`;

export const SHOP_FILE_DIR = LIVE_SITE ? `${AWS_URL}/images/shops/` : `${AWS_URL}/images/stage/shops/`;

export const SHOP_FILE_DIR2 = LIVE_SITE ? `images/shops/` : `images/stage/shops/`;

export const NEWSLETTER_FILE_DIR = `${AWS_URL}/newsletters/`;

export const NEWSLETTER_IMAGE_FILE_DIR = LIVE_SITE ? `${AWS_URL}/images/newsletters/` : `${AWS_URL}/images/stage/newsletters/`;

export const NEWSLETTER_IMAGE_FILE_DIR2 = LIVE_SITE ? `images/newsletters/` : `images/stage/newsletters/`;

// Update this with each release
export const version = '2.5.9';

// used for invalidating cache with rolling release
export const lastVersion = '2.5.8';

export const gameIds = {
	ACGC: 1,
	ACWW: 2,
	ACCF: 3,
	ACNL: 4,
	ACPC: 7,
	ACNH: 8,
};

export const gameIdFolderMap = {
	[gameIds.ACGC]: 'gc',
	[gameIds.ACWW]: 'ww',
	[gameIds.ACCF]: 'cf',
	[gameIds.ACNL]: 'nl',
	[gameIds.ACNH]: 'nh',
};

// String Regexes
export const regexes = {
	// Retrieves the dream address regex (for AC:NL)
	dreamAddressNL: '^[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}$',
	// Retrieves the dream address regex (for AC:NH)
	dreamAddressNH: '^DA-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}$',
	// Retrieves the happy home network id regex
	happyHomeNetworkId: '^RA-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}$',
	creatorId: '^MA-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}$',
	// Regex for whole numbers.
	wholeNumber: '^\\d+$',
	// Regex for email addresses.
	email: '^[^@]+@[^@]+(\\.[^@]+)+$',
	email2: '^[^\\s@]+@[^\\s@]+\.[^\\s@]+$', // eslint-disable-line no-useless-escape
	// Retrieves the pattern design id regex
	designId: '^MO-[0-9A-Z]{4}-[0-9A-Z]{4}-[0-9A-Z]{4}$',
	// Retrieves the dodo code regex
	dodoCode: '^[0-9A-Z]{5}$',
	// Retrieves the secret code (AC:GC) regex
	secretCode: '^[0-9A-Za-zA&#%@!]{14} [0-9A-Za-zA&#%@!]{14}$',
	// Note: 'test-user' and other test accounts aren't detected
	userTag: '@(\\w+)',
	userTag2: '^@(\\w+)|\\s@(\\w+)',
	userTag3: /@(\w+)/g,
	username: '([A-Za-z0-9_]+)',
	parseEmail: /[^< ]+(?=>)/g,
	base64: /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/,
	newLineToHTML: /(?:\r\n|\r|\n)/g,
	nonWhitespaceCharacters: /^\S*$/,
	uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
};

// String Placeholders
export const placeholders = {
	// Retrieves the dream address placeholder (for AC:NL)
	dreamAddressNL: 'XXXX-XXXX-XXXX',
	// Retrieves the dream address placeholder (for AC:NH)
	dreamAddressNH: 'DA-XXXX-XXXX-XXXX',
	// Retrieves the happy home network id placeholder
	happyHomeNetworkId: 'RA-XXXX-XXXX-XXXX',
	creatorId: 'MA-XXXX-XXXX-XXXX',
	// Retrieves the pattern design id placeholder
	designId: 'MO-XXXX-XXXX-XXXX',
	// Retrieves the dodo code placeholder
	dodoCode: 'XXXXX',
	// Retrieves the secret code (AC:GC) placeholder
	secretCode: 'XXXXXXXXXXXXXX XXXXXXXXXXXXXX',
};

// DB Board IDs
export const boardIds = {
	accForums: 300000000,
	currentRules: 200000147,
	privateThreads: 200000036,
	siteSupport: 200000003,
	siteSuggestions: 200000134,
	announcements: 200000070,
	profanity: 200000321,
	userSubmissions: 200000128,
	gettingStarted: 200000065,
	modmin: 200000034,
	adopteeThread: 400000000,
	adopteeBT: 400000001,
	ggBoard: 200000137,
	publicThreads: 200000096,
	staffThreads: 200000196,
	archivedBoards: 300000001,
	trading: 300000008,
	archivedStaffBoards: 300000004,
	archivedAdminBoards: 300000006,
	newMember: 300000003,
	siteRelated: 300000009,
	featuresDashboard: 300000005,
	archivedSpecialProjects: 300000010,
	shopThread: 410000000,
	schrodingersChat: 200000336, // see daily.cjs
	ggOffTopic: 200000139,
	ggWiFiLobby: 200000138,
	colorDuels: 200000002,
};

// Max String Length or Number Lengths
export const max = {
	patternName: 50,
	// The max length of a town or character name.
	keyboardName: 32,
	tuneName: 50,
	searchUsername: 20,
	number: 1000000000,
	postTitle: 100,
	post1: 8000,
	post2: 16000,
	post3: 32000,
	staffPost: 100000,
	// TP Additional Info
	additionalInfo: 8000,
	profanityWord: 200,
	addMultipleUsers: 200,
	itemName: 100,
	guideContent: 500000,
	guideName: 100,
	guideDescription: 200,
	gameName: 200,
	gamePattern: 100,
	gamePlaceholder: 100,
	pollQuestion: 100,
	pollDescription: 200,
	pollDuration: 60,
	pollOption: 100,
	// Profile Location
	location: 300,
	ruleNumber: 50,
	ruleName: 100,
	ruleDescription: 8000,
	ruleViolationNumber: 100,
	ruleViolation: 200,
	signature1: 400,
	signature2: 600,
	signature3: 800,
	// TP Address
	address: 1000,
	// TP Comments, Rating Comment, UT Comment
	comment: 1000,
	// TP Active
	active: 30,
	// Profile Name
	name: 100,
	bio1: 8000,
	bio2: 16000,
	bio3: 24000,
	bio4: 32000,
	userTitle: 17,
	username: 15,
	email: 10000,
	subject: 100,
	boardTitle: 50,
	boardDescription: 400,
	imagesPost: 4,
	imagesThread: 24,
	imagesProfile: 12,
	imageCaption: 200,
	shopName: 50,
	shopShortDescription: 100,
	shopDescription: 30000,
	shopPerOrder: 100,
	shopServiceName: 50,
	shopServiceDescription: 100,
	shopRoleName: 50,
	shopRoleDescription: 100,
	shopMaxPositions: 50,
	shopOrderComment: 100,
	url: 100,
	towns: 30,
	supportEmailBody: 8000,
	donationAmount: 5000,
	newsletterArticleName: 100,
	newsletterArticleContent: 20000,
	newsletterArticleQuestion: 500,
	newsletterArticleAnswer: 100,
	newsletterArticleSilhouetteAnswer: 500,
	newsletterArticleSilhouetteAnswerAdditional: 500,
};

export const min = {
	username: 3,
	number: 1,
	donationAmount: 5,
};

export const pattern = {
	// Identifier for transparent color
	transparentColorId: 9999,
	// How long a pattern's data will be
	length: 1024,
	// How long x by y a pattern will be.
	paletteLength: 32,
	// How many colors are in a palette
	numberOfColors: 15,
	// How many bytes in a AC QR code
	qrCodeLength: 620,
};

export const town = {
	// Identifier for no image.
	noImageId: String(9999),
	// How many colors in 'palette' (Map Designer)
	numberOfColors: 10,
	// What type (full, diagonal - in which direction) for each rectangle (Map Designer)
	rectTypes: {
		1: { value: 'rect', name: 'Full Square' },
		2: { value: 'top-right', name: 'Top Right' },
		3: { value: 'bottom-left', name: 'Bottom Left' },
		4: { value: 'bottom-right', name: 'Bottom Right' },
		5: { value: 'top-left', name: 'Top Left' },
	},
	// Get types for catalog (user / character).
	catalogTypes: {
		user: 'user',
		character: 'character',
		pc: 'pc',
	},
	// Get mapping of characters > AC images.
	keyboardConfig: [
		{ title: 'Key', character: 'A0', filename: 'key' },
		{ title: 'Space', character: 'P0', filename: 'sp' },
		{ character: 'K7', filename: 'whiskers_left' },
		{ character: 'K8', filename: 'whiskers_right' },
		{ character: 'M1', filename: '1' },
		{ character: 'M2', filename: '2' },
		{ character: 'M3', filename: '3' },
		{ character: 'M4', filename: '4' },
		{ character: 'M5', filename: '5' },
		{ character: 'M6', filename: '6' },
		{ character: 'M7', filename: '7' },
		{ character: 'M8', filename: '8' },
		{ character: 'M9', filename: '9' },
		{ character: 'M0', filename: '0' },
		{ character: 'N1', filename: 'A' },
		{ character: 'N2', filename: 'B' },
		{ character: 'N3', filename: 'C' },
		{ character: 'N4', filename: 'D' },
		{ character: 'N5', filename: 'E' },
		{ character: 'N6', filename: 'F' },
		{ character: 'N7', filename: 'G' },
		{ character: 'N8', filename: 'H' },
		{ character: 'N9', filename: 'I' },
		{ character: 'N0', filename: 'J' },
		{ character: 'O1', filename: 'K' },
		{ character: 'O2', filename: 'L' },
		{ character: 'O3', filename: 'M' },
		{ character: 'O4', filename: 'N' },
		{ character: 'O5', filename: 'O' },
		{ character: 'O6', filename: 'P' },
		{ character: 'O7', filename: 'Q' },
		{ character: 'O8', filename: 'R' },
		{ character: 'O9', filename: 'S' },
		{ character: 'P1', filename: 'T' },
		{ character: 'P2', filename: 'U' },
		{ character: 'P3', filename: 'V' },
		{ character: 'P4', filename: 'W' },
		{ character: 'P5', filename: 'X' },
		{ character: 'P6', filename: 'Y' },
		{ character: 'P7', filename: 'Z' },
		{ character: 'P8', filename: ',' },
		{ character: 'P9', filename: 'period' },
	],
};

export const rating = {
	// Get configurations for each rating type.
	configs: {
		positive: { id: 'positive', imageAlt: 'Positive', image: 'feedback_positive.gif', text: 'Positive' },
		neutral: { id: 'neutral', imageAlt: 'Neutral', image: 'feedback_neutral.gif', text: 'Neutral' },
		negative: { id: 'negative', imageAlt: 'Negative', image: 'feedback_negative.gif', text: 'Negative' },
	},
	types: {
		wifi: 'wifi',
		trade: 'trade',
		scout: 'scout',
		shop: 'shop',
	},
};

export const tradingPost = {
	// Get statuses for listings.
	listingStatuses: { // see daily.cjs
		open: 'Open',
		offerAccepted: 'Offer Accepted',
		inProgress: 'In Progress',
		completed: 'Completed',
		closed: 'Closed',
		cancelled: 'Cancelled',
		failed: 'Failed',
		expired: 'Expired',
	},
	// Get statuses for offers.
	offerStatuses: { // see daily.cjs
		pending: 'Pending',
		onHold: 'On Hold',
		accepted: 'Accepted',
		rejected: 'Rejected',
		cancelled: 'Cancelled',
	},
	// Get types for listings.
	listingTypes: {
		buy: 'Buy',
		sell: 'Sell',
		both: 'Both',
	},
	listingTypesArray: [
		{ id: 'Buy', name: 'Looking For' },
		{ id: 'Sell', name: 'Selling' },
		{ id: 'Both', name: 'Both' },
	],
	// Get types for trade (real world items or game items).
	tradeTypes: {
		real: 'real',
		game: 'game',
	},
	// When a trade expires.
	tradeExpiry: 7, // see daily.cjs
	// Age user must be to trade real world items.
	realTradeAge: 16,
	maxItems: 15,
};

export const userTicket = {
	// DB UT Status 'Open' id
	openStatusId: 1,
	closeStatusId: 4,
	statuses: {
		open: 'Open',
		inProgress: 'In Progress',
		inDiscussion: 'In Discussion',
		closed: 'Closed',
		inUserDiscussion: 'In User Discussion',
	},
	types: {
		thread: 'thread',
		post: 'post',
		pattern: 'pattern',
		// pattern reported from town page, which may be disassociated from pattern
		townFlag: 'town_flag',
		tune: 'tune',
		// tune reported from town page, which may be disassociated from tune
		townTune: 'town_tune',
		map: 'map',
		town: 'town',
		character: 'character',
		rating: 'rating',
		listing: 'listing',
		listingComment: 'listing_comment',
		offer: 'offer',
		profileLocation: 'profile_location',
		profileSignature: 'profile_signature',
		profileBio: 'profile_bio',
		profileName: 'profile_name',
		profileUsername: 'profile_username',
		profileUserTitle: 'profile_user_title',
		profileImage: 'profile_image',
		postImage: 'post_image',
		shopName: 'shop_name',
		shopShortDescription: 'shop_short_description',
		shopDescription: 'shop_description',
		shopImage: 'shop_image',
		shopServiceName: 'shop_service_name',
		shopServiceDescription: 'shop_service_description',
		shopRoleName: 'shop_role_name',
		shopRoleDescription: 'shop_role_description',
		shopOrder: 'shop_order',
		shopApplication: 'shop_application',
		articleComment: 'article_comment',
	},
	actions: {
		noAction: 'no_action',
		delete: 'delete',
		modify: 'modify',
		lockThread: 'lock_thread',
		moveThread: 'move_thread',
	},
};

export const supportTicket = {
	status: {
		open: 'Open',
		closed: 'Closed',
	},
	statuses: [
		'Open',
		'Closed',
	],
};

export const scoutHub = {
	// How many days a user is considered to be a new member
	newMemberEligibility: 14, // see daily.cjs
	// Default message if scout doesn't have one for opening adoptee thread
	defaultWelcomeTemplate: `
Thank you for signing up for adoption!

I will respond as soon as possible to whatever questions you might have.

I can help you get your first trade set up, or create your first pattern, or anything else you'd like to do on the site.

Please be patient with me and I'll respond as soon as possible.
	`,
	// Default message if scout doesn't have one for locking adoptee thread
	defaultClosingTemplate: `
Congrats on no longer being a new member!

I hope I was able to help you with your introduction to ACC! Feel free to reach out to me anytime.
	`,
};

export const notification = {
	types: {
		PT: 'private_thread',
		FT: 'follow_thread',
		FB: 'follow_board',
		usernameTag: 'username_tag',
		listingCancelled: 'listing_cancelled',
		listingExpired: 'listing_expired',
		listingComment: 'listing_comment',
		listingOffer: 'listing_offer',
		listingOfferAccepted: 'listing_offer_accepted',
		listingOfferRejected: 'listing_offer_rejected',
		listingOfferCancelled: 'listing_offer_cancelled',
		listingContact: 'listing_contact',
		listingCompleted: 'listing_completed',
		listingFailed: 'listing_failed',
		listingFeedback: 'listing_feedback',
		scoutAdoption: 'scout_adoption',
		scoutThread: 'scout_thread',
		scoutClosed: 'scout_closed',
		scoutThreadClosed: 'scout_thread_closed',
		scoutFeedback: 'scout_feedback',
		scoutBT: 'scout_bt',
		modminUT: 'modmin_ut',
		modminUTMany: 'modmin_ut_many',
		modminUTPost: 'modmin_ut_post',
		modminUTDiscussion: 'modmin_ut_discussion',
		ticketProcessed: 'ticket_processed',
		announcement: 'announcement',
		supportTicket: 'support_ticket',
		supportTicketProcessed: 'support_ticket_processed',
		feature: 'feature',
		featurePost: 'feature_post',
		followFeature: 'follow_feature',
		supportEmail: 'support_email',
		giftDonation: 'gift_donation',
		giftBellShop: 'gift_bell_shop',
		shopThread: 'shop_thread',
		shopEmployee: 'shop_employee',
		shopOrder: 'shop_order',
		shopApplication: 'shop_application',
		donationReminder: 'donation_reminder',
		postQuote: 'post_quote',
		postReaction: 'post_reaction',
		avatarCleared: 'avatar_cleared',
		badge: 'badge',
		FT_edit: 'followed_thread_edit',
	},
};

export const orderOptions = {
	node: [
		{ id: 'creation_time', name: 'Creation' },
		{ id: 'latest_reply_time', name: 'Reply' },
	],
	topBells: [
		{ id: 'rank', name: 'Rank' },
		{ id: 'missed_bells', name: 'Missed Bells' },
		{ id: 'total_jackpot_bells', name: 'Total Jackpot Bells' },
		{ id: 'jackpots_found', name: 'Jackpots Found' },
		{ id: 'jackpots_missed', name: 'Jackpots Missed' },
	],
};

export const bellShop = {
	currencies: {
		bells: 'Bells',
	},
	categories: {
		avatarCharacters: 'Avatar Characters',
		avatarBackgrounds: 'Avatar Backgrounds',
		avatarAccents: 'Avatar Accents',
		backgroundColorations: 'Background Colorations',
		avatarCharactersId: 3,
		avatarBackgroundsId: 2,
		avatarAccentsId: 1,
		reactionsId: 5,
	},
	giftBellLimit: 10000,
};

export const shops = {
	itemsServiceId: 1,
	categories: {
		orders: 'orders',
		applications: 'applications',
		threads: 'threads',
	},
};

export const badges = {
	tenpatterns: 1,
	totpd: 2,
	seasons: 3,
	admin: 4,
	mod: 5,
	dev: 6,
	researcher: 7,
	scout: 8,
	oneyear: 9,
	fiveyears: 10,
	tenyears: 11,
	twentyyears: 12,
	fiftykbellsday: 13,
	onedonater: 14,
	twodonater: 15,
	threedonater: 16,
	acc2: 17,
	tentunes: 18,
	townallgames: 19,
	tentrades: 20,
	top5bells: 21,
	tenbellshop: 22,
	tenorderedshop: 23,
	tenbuddies: 24,
	gcitems: 25,
	wwitems: 26,
	cfitems: 27,
	nlitems: 28,
	nhitems: 29,
	pcitems: 30,
	rwitems: 31,
	tengiftsbellshop: 32,
	tendeliveredshop: 33,
	adopted: 34,
	sitediscussion: 35,
	pushnotifications: 36,
	threadstickied: 37,
	special: 38,
	reportbug: 39,
	suggestion: 40,
	tenmuseum: 41,
	tencreatorthreads: 42,
	// tenthreads: 43, -- unused
	tenratings: 44,
	tenwelcomes: 45,
	southernhemisphere: 46,
	event: 47,
};

// OTHER //

// Get types for polls.
export const pollTypes = {
	upcoming: 'upcoming',
	previous: 'previous',
};

// Get identifiers for calendar categories.
export const calendarCategories = {
	events: 'events',
	birthdays: 'birthdays',
	creatures: 'creatures',
};

// DB identifiers for staff.
export const staffIdentifiers = {
	owner: 'owner',
	mod: 'mod',
	admin: 'admin',
	devTL: 'dev-TL',
	researcherTL: 'researcher-TL',
	dev: 'dev',
	researcher: 'researcher',
	scout: 'scout',
	exStaff: 'ex-staff',
};

export const userGroupIds = {
	owner: 9,
	mod: 2,
	admin: 3,
	devTL: 10,
	researcherTL: 11,
	dev: 6,
	researcher: 5,
	scout: 4,
	exStaff: 7,
};

export const groupIdentifiers = {
	anonymous: 'anonymous',
	user: 'user',
};

export const defaultAvatar = {
	background: {
		id: null,
		name: 'Default',
		image: 'default',
		colorable: false,
		tags: [],
	},
	coloration: null,
	character: {
		id: null,
		name: 'Default',
		image: 'default',
		tags: [],
	},
	accent: null,
	accentPosition: null,
};

export const avatarAccentPositions = [
	{
		id: 1,
		name: 'Upper left',
		filename: 'upper_left.png',
	},
	{
		id: 2,
		name: 'Upper right',
		filename: 'upper_right.png',
	},
	{
		id: 3,
		name: 'Lower left',
		filename: 'lower_left.png',
	},
	{
		id: 4,
		name: 'Lower right',
		filename: 'lower_right.png',
	},
];

export const boolOptions = [
	{ id: 'yes', name: 'Yes' },
	{ id: 'no', name: 'No' },
	{ id: 'both', name: 'Both' },
];

export const flatBoolOptions = ['yes', 'no', 'both'];

export const formatOptions = ['markdown', 'bbcode', 'plaintext'];

export const boardTypeOptions = ['public', 'staff', 'archived'];

export const addRemoveOptions = [
	{ id: 'add', name: 'Add' },
	{ id: 'remove', name: 'Remove' },
];

export const featureStatuses = {
	suggestion: 'suggestion',
	workList: 'work-list',
	inProgress: 'in-progress',
	discussion: 'discussion',
	live: 'live',
	rejected: 'rejected',
};

export const testAccounts = [
	2, // test-admin
	3, // test-mod
	4, // test-scout
	5, // test-user
	7, // test-researcher
	11, // test-developer
	12, // test-ex-staff
	840405, // test-owner
	840406, // test-dev-lead
	840407, // test-researcher-lead
	840408, // test-new-member
];

export const matching = {
	friendCodes: 'Friend Codes',
	ipAddresses: 'IP Addresses',
};

export const reverseOptions = [
	{ id: false, name: 'Forward' },
	{ id: true, name: 'Backward' },
];

export const bellTypeOptions = [
	{ id: 'all', name: 'All Time' },
	{ id: 'seasonal', name: 'Seasonal' },
];

export const bellThreshold = 10;

export const months = [
	{ id: 1, name: 'January' },
	{ id: 2, name: 'February' },
	{ id: 3, name: 'March' },
	{ id: 4, name: 'April' },
	{ id: 5, name: 'May' },
	{ id: 6, name: 'June' },
	{ id: 7, name: 'July' },
	{ id: 8, name: 'August' },
	{ id: 9, name: 'September' },
	{ id: 10, name: 'October' },
	{ id: 11, name: 'November' },
	{ id: 12, name: 'December' },
];

export const nodePermissions = {
	read: 1,
	reply: 2,
	lock: 3,
	edit: 4,
	sticky: 5,
	adminLock: 6,
	move: 7,
	addUsers: 8,
	removeUsers: 9,
	react: 10,
};

export const ggBoardAge = 16;

export const threadPageSize = 25;

export const accUserId = 63167;

// starts with
export const approvedURLs = [
	'/',
	SITE_URL,
	'http://newsletter.animalcrossingcommunity.com',
	'http://financial.animalcrossingcommunity.com',
	'http://www.animalcrossingcommunity.com',
	'https://animalcrossingcommunity.s3.amazonaws.com',
	'https://ACCommunity.redbubble.com',
	'https://accommunity.redbubble.com',
	'http://accommunity-pr-',
	'https://accommunity-pr-',
	'https://accounts.animalcrossingcommunity.com',
	'https://animalcrossingcommunity.com',
	'https://www.animalcrossingcommunity.com',
	'https://accommunity-staging.herokuapp.com',
	'https://cdn-s3.animalcrossingcommunity.com',
	'https://accommunity-staging.autoidleapp.com',
	'https://staging.animalcrossingcommunity.com',
	'https://financial.animalcrossingcommunity.com',
];

export const launchDate = '2023-09-25';

export const cacheKeys = {
	sortedCategories: 'sortedCategories',
	sortedAcGameCategories: 'sortedAcGameCategories',
	residents: 'residents',
	creatures: 'creatures',
	events: 'events',
	years: 'years',
	alphabeticalAvatarBackgrounds: 'alphabeticalAvatarBackgrounds',
	alphabeticalAvatarCharacters: 'alphabeticalAvatarCharacters',
	alphabeticalAvatarColorations: 'alphabeticalAvatarColorations',
	alphabeticalAvatarAccents: 'alphabeticalAvatarAccents',
	avatarTags: 'avatarTags',
	sortedBellShopItems: 'sortedBellShopItems',
	bellShopCategories: 'bellShopCategories',
	pwps: 'pwps',
	indexedAvatarAccents: 'indexedAvatarAccents',
	indexedAvatarBackgrounds: 'indexedAvatarBackgrounds',
	indexedAvatarCharacters: 'indexedAvatarCharacters',
	indexedAvatarColorations: 'indexedAvatarColorations',
	// using routes as cache keys means some of the non-user API calls saved
	// (iso-server) are cleared when db cached queries are cleared
	donations: 'v1/donations', // see iso-server
	userGroupUsers: 'v1/user_group/users', // see iso-server
	rulesCurrent: 'v1/rule/current', // see iso-server
	userLite: 'v1/user_lite', // see iso-server
	tunes: 'v1/tune', // cleared when saving / destroying tune
	patterns: 'v1/pattern', // cleared when saving / destroying pattern
	announcements: 'v1/node/announcements', // cleared when making announcement
	guides: 'v1/guide', // cleared when saving / destroying / publishing guide
	acGameGuide: 'v1/acgame/guide', // cleared when saving / destroying / publishing guide
	games: 'v1/games', // cleared when saving / destroying games (Game Admin page)
	acGame: 'v1/acgame', // never force cleared
	siteSetting: 'v1/site_setting', // never force cleared
	newsletter: 'v1/newsletter', // cleared when saving / destroying / publishing newsletter
	featureCategories: 'v1/feature/categories',
	featureStatuses: 'v1/feature/statuses',
};

export const cacheKeysACData = {
	sortedCategories: 'sortedCategories',
	sortedAcGameCategories: 'sortedAcGameCategories',
	residents: 'residents',
	creatures: 'creatures',
	events: 'events',
	years: 'years',
	alphabeticalAvatarBackgrounds: 'alphabeticalAvatarBackgrounds',
	alphabeticalAvatarCharacters: 'alphabeticalAvatarCharacters',
	alphabeticalAvatarColorations: 'alphabeticalAvatarColorations',
	alphabeticalAvatarAccents: 'alphabeticalAvatarAccents',
	avatarTags: 'avatarTags',
	sortedBellShopItems: 'sortedBellShopItems',
	bellShopCategories: 'bellShopCategories',
	pwps: 'pwps',
	indexedAvatarAccents: 'indexedAvatarAccents',
	indexedAvatarBackgrounds: 'indexedAvatarBackgrounds',
	indexedAvatarCharacters: 'indexedAvatarCharacters',
	indexedAvatarColorations: 'indexedAvatarColorations',
};

export const webSocketTypes = {
	notification: 'notification',
	post: 'post',
};

const allImagesModules = import.meta.glob(
	'/src/client/images/**/*',
	{
		eager: true,
		query: '?url',
		import: 'default',
	},
);

export const allImages = Object.fromEntries(
	Object.entries(allImagesModules).map(([path, url]) =>
	{
		const relative = path.replace('/src/client/images/', '');
		return [relative, url as string];
	}),
);
