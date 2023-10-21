// This file is for any constants that are useful throughout the site.
// No dependencies should be added.

export const LIVE_SITE = process.env.HEROKU_APP_NAME === 'animalcrossingcommunity';

export const SITE_URL = process.env.HEROKU_APP_NAME === 'animalcrossingcommunity' ? 'https://www.animalcrossingcommunity.com' : `https://${process.env.HEROKU_APP_NAME}.herokuapp.com`;

export const USER_FILE_DIR = process.env.HEROKU_APP_NAME === 'animalcrossingcommunity' ? `${process.env.AWS_URL}/images/users/` : `${process.env.AWS_URL}/images/stage/users/`;

export const USER_FILE_DIR2 = process.env.HEROKU_APP_NAME === 'animalcrossingcommunity' ? `images/users/` : `images/stage/users/`;

// Update this with each release; it helps with css / js caching (see index.ejs)
export const version = '2.1.3';

export const gameIds = {
	ACGC: 1,
	ACWW: 2,
	ACCF: 3,
	ACNL: 4,
	ACPC: 7,
	ACNH: 8,
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
	email2: '^[^\\s@]+@[^\\s@]+\.[^\\s@]+$',
	// Retrieves the pattern design id regex
	designId: '^MO-[0-9A-Z]{4}-[0-9A-Z]{4}-[0-9A-Z]{4}$',
	// Retrieves the dodo code regex
	dodoCode: '^[0-9A-Z]{5}$',
	// Retrieves the secret code (AC:GC) regex
	secretCode: '^[0-9A-Za-zA&#%@!]{14} [0-9A-Za-zA&#%@!]{14}$',
	userTag: '@(\\w+)',
	userTag2: '^@(\\w+)|\\s@(\\w+)',
	username: '([A-Za-z0-9_]+)',
	parseEmail: /[^< ]+(?=>)/g,
	base64: /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/,
	newLineToHTML: /(?:\r\n|\r|\n)/g,
	nonWhitespaceCharacters: /^\S*$/
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
	archivedBoards: 300000001,
	trading: 300000008,
	archivedStaffBoards: 300000004,
	archivedAdminBoards: 300000006,
	newMember: 300000003,
	siteRelated: 300000009,
	featuresDashboard: 300000005,
	archivedSpecialProjects: 300000010,
};

// All Public Non-Archived Boards
// Any board an anonymous user can see
export const allPublicBoards = [
	200000055, // AC:GC Trading
	200000364, // AC:NH Looking For
	200000367, // AC:NH Offering
	200000257, // AC:NL Item Trading
	200000306, // AC:NL Villager Trading
	200000320, // e-Reader & amiibo Card Trading
	200000062, // Animal Crossing Discussion
	200000152, // AC:CF General
	200000001, // AC:GC General
	200000318, // AC:HHD General
	200000363, // AC:NH General
	200000255, // AC:NL General
	200000356, // AC:PC General
	200000097, // AC:WW General
	200000319, // e-Reader & amiibo
	200000070, // Announcements
	200000065, // Getting Started
	200000002, // Off Topic
	200000337, // Chit-Chat
	200000069, // Contests and Competitions
	200000090, // Creative Writing
	200000093, // Entertainment
	200000145, // Forum Games
	200000033, // Video Gaming and Consoles
	200000105, // Shops and Services
	200000095, // Giveaways
	200000267, // Promotional Contests
	200000266, // Recruitment
	200000149, // Ask the Staff
	200000003, // Site Support
	200000140, // Wi-Fi Lobby
	200000365, // AC:NH WiFi Lobby
	200000258, // AC:NL Wi-Fi Lobby
	200000098 // Wi-Fi Tech Support
];

export const staffBoards = [
	200000034, // Administrative
	200000082, // Admin Board
	200000147, // Current Rules
	200000144, // Feature Requests
	200000146, // Pending Rules, Policies & Guidelines
	200000321, // Profanity Filter
	300000007, // Special Projects
	200000333, // Game Guides
	200000342, // Media & Events
	200000068, // Staff Board
	200000250, // Developer Board
	200000133, // Researcher Board
	200000252, // Scout Board
];

// Max String Length or Number Lengths
export const max = {
	patternName: 50,
	// The max length of a town or character name.
	keyboardName: 32,
	tuneName: 50,
	searchUsername: 20,
	number: 1000000000,
	postTitle: 100,
	post: 8000,
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
	userTitle: 17,
	username: 15,
	email: 10000,
	subject: 100,
	boardTitle: 50,
	boardDescription: 400,
	imagesPost: 4,
	imagesProfile: 12,
	imageCaption: 200,
};

export const min = {
	username: 3,
	number: 1,
}

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
	// Get types for rating (wifi / trade).
	types: {
		wifi: 'wifi',
		trade: 'trade',
		scout: 'scout',
	},
};

export const tradingPost = {
	// Get statuses for listings.
	listingStatuses: {
		open: 'Open',
		offerAccepted: 'Offer Accepted',
		inProgress: 'In Progress',
		completed: 'Completed',
		closed: 'Closed',
		cancelled: 'Cancelled',
		failed: 'Failed',
		expired: 'Expired'
	},
	// Get statuses for offers.
	offerStatuses: {
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
		{ id: 'Both', name: 'Both' }
	],
	// Get types for trade (real world items or game items).
	tradeTypes: {
		real: 'real',
		game: 'game',
	},
	// When a trade expires.
	tradeExpiry: 7,
	// Age user must be to trade real world items.
	realTradeAge: 16,
	maxItems: 15,
};

export const userTicket = {
	// DB UT Status 'Open' id
	openStatusId: 1,
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
	newMemberEligibility: 14,
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
	},
}

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
	},
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
		colorable: false
	},
	coloration: null,
	character: {
		id: null,
		name: 'Default',
		image: 'default'
	},
	accent: null,
	accentPosition: null
};

export const avatarAccentPositions = [
	{
		id: 1,
		name: 'Upper left',
		filename: 'upper_left.png'		
	},
	{
		id: 2,
		name: 'Upper right',
		filename: 'upper_right.png'		
	},
	{
		id: 3,
		name: 'Lower left',
		filename: 'lower_left.png'		
	},
	{
		id: 4,
		name: 'Lower right',
		filename: 'lower_right.png'		
	}
]

export const boolOptions = [
	{ id: 'yes', name: 'Yes' },
	{ id: 'no', name: 'No' },
	{ id: 'both', name: 'Both' },
];

export const flatBoolOptions = ['yes', 'no', 'both'];

export const formatOptions = ['markdown', 'bbcode', 'plaintext'];

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
};

export const ggBoardAge = 16;

export const threadPageSize = 25;

export const accUserId = 63167;