/* UserError
 * You should throw this kind of error when there is an error message that
 * should be shown to a user.
 * 
 * Call it as `new UserError('test')` where 'test' is the identifier of an error
 * message in the list below.
 * 
 * You can throw multiple errors at once:
 *    `new UserError('bad-format', 'permission')`
 * These will appear as a bullet list.
 */
export class UserError extends Error
{
	constructor(...identifiers: any)
	{
		super();
		this.name = 'UserError';
		(this as any).identifiers = identifiers;
		Object.freeze(this);
	}
}


/* This is the list of error messages that can be used in UserError.
 * When displayed, the message is prefixed with "Sorry!".
 * 
 * "code" is an HTTP status code. This is a machine-readable number that
 * identifies the category of the error. See Wikipedia for a list of valid ones.
 * The most common are:
 *    400 - input is missing parameters or otherwise fails to match a required format
 *    401 - user needs to log in
 *    403 - user has the wrong permissions set
 *    404 - failed to find something (e.g. a search term or ID number was incorrect)
 *    409 - multiple people are accidentally trying to do the same thing at once. or one person has accidentally tried to do the same thing multiple times
 *    410 - tried to access something that has been deleted
 *    418 - reserved for April Fools' pranks (this is actually an international standard, believe it or not)
 */

export const ERROR_MESSAGES = {
	// Miscellaneous error messages, useful in a lot of different contexts
	'bad-format': {
		// This should be used if a piece of input is wrong in a way that should be impossible with the restrictions in the UI.
		// In production, it should only appear if (a) there is a bug or (b) the user was messing around with form controls in their browser's dev tools.
		// If you need to display an error message that a user might plausibly come across in normal usage,
		//     consider creating a new unique error message of your own.
		message: 'Hmm, looks like something’s not quite right! Have another go at whatever you were trying to do, and if it still doesn’t work, let us know and we’ll look into it.',
		code: 400,
	},
	'login-needed': {
		message: 'You must be a member to access this area. Click the "Log In" button to log in or "Sign Up" button to create an account.',
		code: 401,
	},
	'permission': {
		message: 'You do not have access to this area.',
		code: 403,
	},
	'javascript-required': {
		message: 'Javascript is required to show the following content.',
		code: 400,
	},
	'large-screen-required': {
		message: 'A larger screen is required to show the following content.',
		code: 400,
	},

	// "Not Found" error messages
	'no-such-node': {
		message: 'The link you just clicked does not exist. The link has been reported, so don’t worry about letting us know. However, if the link was from a post by another user, you can let them know that the link is broken.',
		code: 404,
	},
	'no-such-user': {
		message: 'That user was not found. Please try your search again.',
		code: 404,
	},
	'no-such-user-group': {
		message: 'We couldn’t find the user group you were looking for.',
		code: 404,
	},
	'no-such-avatar': {
		message: 'That avatar element doesn’t exist, or you’re not able to use it.',
		code: 404,
	},
	'no-such-avatar-tag': {
		message: 'That avatar tag doesn’t exist.',
		code: 404,
	},
	'no-such-town': {
		message: 'We couldn’t find the player town you were looking for. If you came here from a link in another user’s post, you should let them know that the link is broken.',
		code: 404,
	},
	'no-such-ac-game': {
		message: 'There is no Animal Crossing game matching the criteria you indicated. Please try again.',
		code: 404,
	},
	'no-such-character': {
		message: 'We couldn’t find the player character you were looking for.',
		code: 404,
	},
	'no-such-tune': {
		message: 'We couldn’t find the town tune you were looking for. If you came here from a link in another user’s post, you should let them know that the link is broken.',
		code: 404,
	},
	'no-such-pattern': {
		message: 'We couldn’t find the pattern you were looking for. If you came here from a link in another user’s post, you should let them know that the link is broken.',
		code: 404,
	},
	'qr-code-file-size-too-large': {
		message: 'The QR code you provided is too large. Current size limit: 100 KBs',
		code: 404,
	},
	'no-such-catalog-category': {
		message: 'We couldn’t find the catalog category you were looking for.',
		code: 404,
	},
	'no-such-friend-code': {
		message: 'We couldn’t find the friend code you were looking for.',
		code: 404,
	},
	'existing-friend-code': {
		message: 'You alread have a friend code with that code and for that game.',
		code: 400,
	},
	'no-such-game': {
		message: 'We couldn’t find the game you were looking for.',
		code: 404,
	},
	'no-such-rating': {
		message: 'We couldn’t find the rating you were looking for.',
		code: 404,
	},
	'no-such-game-console': {
		message: 'We couldn’t find the game console you were looking for.',
		code: 404,
	},
	'no-such-listing': {
		message: 'We couldn’t find the trading post listing you were looking for. If you came here from a link in another user’s post, you should let them know that the link is broken.',
		code: 404,
	},
	'no-such-listing-comment': {
		message: 'We couldn’t find the trading post listing comment you were looking for.',
		code: 404,
	},
	'too-many-items': {
		message: 'You can only have 15 unique items / villagers in your listing / offer.',
		code: 404,
	},
	'no-such-offer': {
		message: 'We couldn’t find the trading post listing offer you were looking for. If you came here from a link in another user’s post, you should let them know that the link is broken.',
	},
	'no-such-poll': {
		message: 'We couldn’t find the poll you were looking for.',
		code: 404,
	},
	'poll-expired': {
		message: 'The current poll is expired and can no longer be modified.',
		code: 404,
	},
	'no-such-feature': {
		message: 'The feature suggestion you requested does not exist.',
		code: 404,
	},
	'no-such-feature-category': {
		message: 'The feature category you specified does not exist.',
		code: 404,
	},
	'no-such-feature-status': {
		message: 'The feature status you specified does not exist.',
		code: 404,
	},
	'no-such-treasure': {
		message: 'We couldn’t find the treasure you were looking for.',
		code: 404,
	},
	'no-such-rule': {
		message: 'We couldn’t find the rule you were looking for.',
		code: 404,
	},
	'no-such-violation': {
		message: 'We couldn’t find the rule violation you were looking for.',
		code: 404,
	},
	'no-such-guide': {
		message: 'We couldn’t find the guide you were looking for.',
		code: 404,
	},
	'no-such-word': {
		message: 'We couldn’t find the filter word you were looking for.',
		code: 404,
	},
	'no-such-user-ticket': {
		message: 'We couldn’t find the user ticket you were looking for.',
		code: 404,
	},
	'no-such-support-email': {
		message: 'We couldn’t find the support email you were looking for.',
		code: 404,
	},
	'no-such-permission': {
		message: 'We couldn’t find the permission you were looking for.',
		code: 404,
	},
	'image-file-size-too-large': {
		message: 'The image you are uploading is too large. Current size limit: 10 MB',
		code: 404,
	},
	'too-many-files': {
		message: 'Too many files are being allowed. Max per post: 4. Max for profile: 12.',
		code: 404,
	},
	'no-such-notification': {
		message: 'We couldn’t find the notification you were looking for.',
		code: 404,
	},
	'no-such-bell-shop-item': {
		message: 'We couldn’t find the Bell Shop item you were looking for.',
		code: 404,
	},
	'no-such-support-ticket': {
		message: 'We couldn’t find the support ticket you were looking for.',
		code: 404,
	},
	'no-such-file': {
		message: 'We couldn’t find the file you were looking for.',
		code: 404,
	},
	'no-such-service': {
		message: 'We couldn’t find the Shop Service you were looking for.',
		code: 404,
	},
	'no-such-shop': {
		message: 'We couldn’t find the Shop you were looking for.',
		code: 404,
	},
	'no-such-role': {
		message: 'We couldn’t find the Shop Role you were looking for.',
		code: 404,
	},
	'too-many-shop-items': {
		message: 'Please review the shop guidelines. You have ordered too many items per order.',
		code: 404,
	},
	'no-such-order': {
		message: 'We couldn’t find the Shop Order you were looking for.',
		code: 404,
	},
	'no-such-application': {
		message: 'We couldn’t find the Shop Application you were looking for.',
		code: 404,
	},

	// User information error messages
	'invalid-email': {
		message: 'The email address you entered is invalid. Please double check that it is correct.',
		code: 400,
	},
	'duplicate-email': {
		message: 'The email address you entered is already in use by another user.',
		code: 409,
	},
	'incomplete-avatar': {
		message: 'Please choose both a background and foreground.',
		code: 400,
	},
	'avatar-permission': {
		message: 'You do not have access to this avatar.',
		code: 400,
	},

	// Errors associated with trying to create/edit a post/thread
	'missing-title': {
		message: 'You need to provide a title for your thread.',
		code: 400,
	},
	'missing-content': {
		message: 'Please enter a message.',
		code: 400,
	},
	'no-such-parent-node': {
		message: 'We couldn’t find the post or thread you were trying to reply to. Head back to the previous page, reload it, and try again.',
		code: 404,
	},
	'node-locked': {
		message: 'This thread is locked.',
		code: 400,
	},

	// Errors associated with features
	'already-claimed': {
		message: 'It appears you’ve already claimed this feature.',
		code: 409,
	},

	// Other
	'missing-town-name': {
		message: 'Please enter a name for your town.',
		code: 400,
	},
	'too-many-pwps': {
		message: 'You can’t have more than 30 Public Works Projects in your town.',
		code: 400,
	},
	'too-many-residents': {
		message: 'You have too many residents in your town.',
		code: 400,
	},
	'too-many-characters': {
		message: 'You have too many characters in your town.',
		code: 400,
	},
	'too-many-town-characters': {
		message: 'You have too many characters.',
		code: 400,
	},
	'too-many-towns': {
		message: 'You have too many towns.',
		code: 400,
	},
	'missing-character-name': {
		message: 'Please enter a name for your character.',
		code: 400,
	},
	'missing-town-tune-name': {
		message: 'Please enter a name for your town tune.',
		code: 400,
	},
	'missing-pattern-name': {
		message: 'Please enter a name for your pattern.',
		code: 400,
	},
	'pattern-published': {
		message: 'This pattern is published and no longer allows editing.',
		code: 403,
	},
	'missing-game-console-name': {
		message: 'Please enter a game console name.',
		code: 400,
	},
	'missing-game-name': {
		message: 'Please enter a game name.',
		code: 400,
	},
	'missing-game-short-name': {
		message: 'Please enter a short game name.',
		code: 400,
	},
	'missing-game-pattern': {
		message: 'Please enter a pattern for this game’s friend code.',
		code: 400,
	},
	'missing-game-placeholder': {
		message: 'Please enter a placeholder for this game’s friend code.',
		code: 400,
	},
	'missing-poll-question': {
		message: 'Please enter a question for your poll.',
		code: 400,
	},
	'max-buddies': {
		message: 'You have reached the max number of buddies you may have.',
		code: 400,
	},
	'missing-guide-name': {
		message: 'Please enter a name for your guide.',
		code: 400,
	},
	'missing-guide-description': {
		message: 'Please enter a description for your guide.',
		code: 400,
	},
	'missing-guide-content': {
		message: 'Please enter content for your guide.',
		code: 400,
	},
	'missing-hemisphere': {
		message: 'Please choose a hemisphere for requested games.',
		code: 400,
	},
	'inappropriate-content': {
		message: 'You have entered content that is not appropriate for this site. Please substitute the following word(s) with content more appropriate for the audience of this site:',
		code: 400,
	},
	'bad-nomination': {
		message: 'Nominations are only accepted for other people.',
		code: 400,
	},
	'username-taken': {
		message: 'You have chosen a username already used.',
		code: 400,
	},
	'email-taken': {
		message: 'We already have an account with that email address.',
		code: 400,
	},
	'max-username-changes': {
		message: 'You have maxed out your username changes and may not change it again.',
		code: 400,
	},
	'live-username-change': {
		message: "You can't change a non-test account's username / username history on a test site.",
		code: 400,
	},
	'live-reset-password': {
		message: "You can't reset a non-test account's password on a test site.",
		code: 400,
	},
	'live-view-birthday': {
		message: "You can't view a non-test account's birthday on a test site.",
		code: 400,
	},
	'new-member-restrictions': {
		message: "As a new member you cannot post here. You can find all new member restrictions <a href='/faq#new-member-restrictions'>here</a>.",
		code: 400,
	},
	'test-account-required': {
		message: "You'll need to use a test account to complete this action.",
		code: 400,
	},
	'signature-max-lines': {
		message: 'No more then 4 lines are allowed for a signature.',
		code: 400,
	},

	// treasure related messages
	'treasure-invalid-user': {
		message: 'Please stop trying to hack the treasures.',
		code: 401,
	},
	'treasure-expired': {
		message: 'Sorry, but the offer on that treasure has expired.',
		code: 410,
	},
	'treasure-redeemed': {
		message: 'The treasure has already been redeemed.',
		code: 409,
	},

	// Bell Shop
	'bell-shop-item-redeemed': {
		message: 'The item has already been redeemed.',
		code: 409,
	},
	'bell-shop-not-enough-bells': {
		message: 'You do not have enough Bells to purchase this item.',
		code: 409,
	},
	'bell-shop-gift-limit': {
		message: `An item's default price must not exceed 10,000 to gift it to another user.`,
		code: 409,
	},

	// admin related messages
	'invalid-rule-delete': {
		message: 'Rule in effect, unable to delete.',
		code: 400,
	},
	'invalid-violation-delete': {
		message: 'Rule Violation in effect, unable to delete.',
		code: 400,
	},
	'invalid-rule-expire': {
		message: 'Rule is new or pending, unable to expire.',
		code: 400,
	},
	'invalid-violation-expire': {
		message: 'Rule Violation is new or pending, unable to expire.',
		code: 400,
	},
	'invalid-rule-restore': {
		message: 'Rule is not pending expiration, unable to restore.',
		code: 400,
	},
	'invalid-violation-restore': {
		message: 'Rule Violation is not pending expiration, unable to restore.',
		code: 400,
	},
	'missing-rule-name': {
		message: 'Please enter a name for your rule.',
		code: 400,
	},
	'missing-rule-description': {
		message: 'Please enter a description for your rule.',
		code: 400,
	},
	'invalid-rule-save': {
		message: 'Rule is unable to save.',
		code: 400,
	},
	'missing-severity': {
		message: 'Please choose a severity for your rule violation.',
		code: 400,
	},
	'missing-violation': {
		message: 'Please enter a violation for your rule violation.',
		code: 400,
	},
	'invalid-validation-save': {
		message: 'Rule Violation is unable to save.',
		code: 400,
	},
	'duplicate-word': {
		message: 'Word is already being filtered.',
		code: 400,
	},
	'change-owner-perms-restricted': {
		message: 'Only a Site Owner may change the Site Owner permissions.',
		code: 403,
	},
	'remove-permission-admin-restricted': {
		message: 'Only a Site Owner may remove the Permission Admin permission from an Administrator.',
		code: 403,
	},
	'shorter-ban': {
		message: 'User may not have their ban reduced through a User Ticket. Use a Support Ticket instead.',
		code: 400,
	},
	'longer-ban': {
		message: 'User may not have their ban increased through a Support Ticket. Use a User Ticket instead.',
		code: 400,
	},
	'cannot-block-user': {
		message: 'This user cannot be blocked. Please reach out via a Support Ticket if you are having trouble with this user.',
		code: 400,
	},
	'blocked': {
		message: 'You are unable to contact this user at this time.',
		code: 400,
	},
	'shop-dnc': {
		message: 'This user is on the Shop Do Not Contact List. You are unable to contact this user at this time.',
		code: 400,
	},
	'shop-pending-application': {
		message: 'You currently have a pending application. Please wait 30 days before applying again.',
		code: 400,
	},
	'shop-current-employee': {
		message: 'You are currently an employee of this shop.',
		code: 400,
	},
	'shop-max-services': {
		message: 'You can only offer 50 services at a time.',
		code: 400,
	},
	'shop-max-roles': {
		message: 'You can only have 200 roles for a shop.',
		code: 400,
	},
	'shop-max-employees': {
		message: 'You can only have 500 employees for a shop.',
		code: 400,
	},
	'shop-max-items': {
		message: 'You can only have 1000 unorderable items for a shop.',
		code: 400,
	},
	'shop-no-owners': {
		message: 'You can not perform this action, as it would lead to no owners for the shop.',
		code: 400,
	},

	// scout adoption
	'already-adopted': {
		message: "You've already been adopted! Reach out to your Scout for help.",
		code: 409,
	},
	'ineligible-adoption': {
		message: "We're sorry, but adoption is only offered to new members.",
		code: 409,
	},

	// Messages for displaying when there are no configured items to display.
	// Should be interpreted slightly different than 'no-such-*' messages by stating
	// 	that there are no items to be displayed. These messages shouldn't be
	// 	product of any direct searches that the user may perform.
	'poll-not-set-up': {
		message: 'Seems like we\'ve missed this poll. Stay tuned for the next one!',
		code: 204,
	},

	// Automation messages. Do not use these in production.
	'bells-not-divisable': {
		message: 'Bells must be divisable by 100.',
		code: 400,
	},

	// Test message. Do not use this in production
	'test': {
		message: 'This is a test error message.',
		code: 418,
	},
};


/**
 * Other kinds of error message, used in specific contexts:
 */

/* AccountsError
 * Thrown when an error is raised while communicating with the accounts site.
 */
export class AccountsError extends Error
{
	constructor(endpoint: any, message: any, statusCode?: any)
	{
		super(`accounts error in ${endpoint}: '${message}'`);
		this.name = 'AccountsError';
		(this as any).statusCode = statusCode;
		Object.freeze(this);
	}
}

/* NotFoundError
 * Thrown when a call is made to an API method that does not exist.
 */
export class NotFoundError extends Error
{
	constructor(method: any, cause: any)
	{
		super(`no such API method '${method}'`);
		this.name = 'NotFoundError';
		this.stack = cause.stack;
		Object.freeze(this);
	}
}

/**
 * ProfanityError
 * Throw when a user submits content that triggers the profanity filter.
 */
export class ProfanityError extends Error
{
	constructor(...words: any)
	{
		super();
		this.name = 'ProfanityError';
		(this as any).identifier = ['inappropriate-content'];
		(this as any).words = words;
		Object.freeze(this);
	}
}
