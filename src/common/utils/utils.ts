// This file is for minor random functions that are useful throughout the site.
// It is included in various places on both the server and client side, so be
// careful what dependencies you add.

import * as constants from './constants.ts';

import acgcMapTiles from '../maps/acgc.json' assert { type: 'json' };
import acwwMapTiles from '../maps/acww.json' assert { type: 'json' };
import accfMapTiles from '../maps/accf.json' assert { type: 'json' };
import acnlMapTiles from '../maps/acnl.json' assert { type: 'json' };
import townTunes from '../tunes/tunes.json' assert { type: 'json' };
import acgcPatterns from '../patterns/acgc.json' assert { type: 'json' };
import acwwPatterns from '../patterns/acww.json' assert { type: 'json' };
import accfPatterns from '../patterns/accf.json' assert { type: 'json' };
import acnlPatterns from '../patterns/acnl.json' assert { type: 'json' };
import acnhPatterns from '../patterns/acnh.json' assert { type: 'json' };
import acnhMaps from '../maps/acnh.json' assert { type: 'json' };

import {
	UserTicketType,
	TicketType,
	UserType,
	UserLiteType,
	MapTilesType,
	PatternPalettesType,
	PatternColorsType,
	PatternColorInfoType,
	MapDesignerColorsType,
	MapDesignerImagesType,
	MapDesignerMapInfoType
} from '@types';

// For case-insensitive, diacritical mark ignoring, natural number sorting
export const sortingCollator = new Intl.Collator('en', { numeric: true, sensitivity: 'base' });

/*
 * Returns the noun possessively written.
 */
export function getPossessiveNoun(noun:string) : string
{
	if (noun.endsWith('s'))
	{
		return noun + "’";
	}

	return noun + "’s";
}

/*
 * Returns the actual length of a string, counting 'astral plane'
 * characters like emoji as one character rather than two.
 */
export function realStringLength(string:any) : number
{
	// JavaScript uses UTF-16 internally, so each astral character is encoded as
	// a pair of bytes: a 'high surrogate' between 0xD800 and 0xDBFF followed by
	// a 'low surrogate' between 0xDC00 and 0xDFFF.
	return String(string || '').replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, ' ').length;
}

/*
 * removes whitespace from the start and end of a string
 */
export function trimString(string:any) : string
{
	return String(string || '').replace(/(^\s+|\s+$)/g, '');
}

/*
 * Returns map tiles for the given game.
 */
export function getMapTiles(gameId:number) : MapTilesType
{
	switch (gameId)
	{
		case constants.gameIds.ACGC:
			return acgcMapTiles;
		case constants.gameIds.ACWW:
			return acwwMapTiles;
		case constants.gameIds.ACCF:
			return accfMapTiles;
		case constants.gameIds.ACNL:
		default:
			return acnlMapTiles;
	}
}

/*
 * Returns town tune notes for the given game.
 */
export function getTownTunes() : {id: number, name: string, img_name: string}[]
{
	return townTunes;
}

/*
 * Returns pattern colors for the given game.
 */
export function getPatternPalettes(gameId?:number) : PatternPalettesType
{
	switch (gameId)
	{
		case constants.gameIds.ACGC:
			return acgcPatterns;
		case constants.gameIds.ACWW:
			return acwwPatterns;
		case constants.gameIds.ACCF:
			return accfPatterns;
		case constants.gameIds.ACNL:
			return acnlPatterns.palettes;
		case constants.gameIds.ACNH:
			return acnhPatterns.palettes;
		default:
			return {
				[constants.gameIds.ACGC]: acgcPatterns,
				[constants.gameIds.ACWW]: acwwPatterns,
				[constants.gameIds.ACCF]: accfPatterns,
				[constants.gameIds.ACNL]: acnlPatterns.palettes,
				[constants.gameIds.ACNH]: acnhPatterns.palettes,
			};
	}
}

/*
 * Returns pattern colors for the given game.
 */
export function getPatternColors(gameId?:number) : PatternColorsType
{
	switch (gameId)
	{
		case constants.gameIds.ACGC:
			return acgcPatterns.map(c => c.colors).flat();
		case constants.gameIds.ACWW:
			return acwwPatterns.map(c => c.colors).flat();
		case constants.gameIds.ACCF:
			return accfPatterns.map(c => c.colors).flat();
		case constants.gameIds.ACNL:
			return acnlPatterns.colors;
		case constants.gameIds.ACNH:
			return acnhPatterns.colors;
		default:
			return {
				[constants.gameIds.ACGC]: acgcPatterns.map(c => c.colors).flat(),
				[constants.gameIds.ACWW]: acwwPatterns.map(c => c.colors).flat(),
				[constants.gameIds.ACCF]: accfPatterns.map(c => c.colors).flat(),
				[constants.gameIds.ACNL]: acnlPatterns.colors,
				[constants.gameIds.ACNH]: acnhPatterns.colors,
			};
	}
}

/*
 * Returns additional pattern color info for a game.
 */
export function getPatternColorInfo(gameId?:number) : PatternColorInfoType
{
	switch (gameId)
	{
		case constants.gameIds.ACGC:
		case constants.gameIds.ACWW:
		case constants.gameIds.ACCF:
		case constants.gameIds.ACNL:
			return [];
		case constants.gameIds.ACNH:
			return acnhPatterns.colorInfo;
		default:
			return {
				[constants.gameIds.ACGC]: [],
				[constants.gameIds.ACWW]: [],
				[constants.gameIds.ACCF]: [],
				[constants.gameIds.ACNL]: [],
				[constants.gameIds.ACNH]: acnhPatterns.colorInfo,
			};
	}
}

/*
 * Whether a color is on the lighter end of spectrum.
 */
export function isColorLight(color:string) : boolean
{
	const hex = color.replace('#', '');
	const c_r = parseInt(hex.substr(0, 2), 16);
	const c_g = parseInt(hex.substr(2, 2), 16);
	const c_b = parseInt(hex.substr(4, 2), 16);
	const brightness = ((c_r * 299) + (c_g * 587) + (c_b * 114)) / 1000;
	return brightness > 155;
}

/*
 * Convert a string to be url friendly. (XSS Protection)
 */
export function convertForUrl(string:string) : string
{
	return encodeURIComponent(string.replace(/\s+/g, '-').toLowerCase());
}

/*
 * Returns map colors for the given game.
 */
export function getMapColors(gameId:number) : MapDesignerColorsType
{
	switch (gameId)
	{
		default:
		case constants.gameIds.ACNH:
			return acnhMaps.colors;
	}
}

/*
 * Returns map images for the given game.
 */
export function getMapImages(gameId:number) : MapDesignerImagesType
{
	switch (gameId)
	{
		default:
		case constants.gameIds.ACNH:
			return acnhMaps.images;
	}
}

/*
 * Returns map info for the given game.
 */
export function getMapInfo(gameId:number) : MapDesignerMapInfoType
{
	switch (gameId)
	{
		default:
		case constants.gameIds.ACNH:
			return acnhMaps.info;
	}
}

/*
 * Equivalent of test-transform: capitalize
 */
export function capitalize(text:string) : string
{
	return text.replace(/\b\w/g , function(m){ return m.toUpperCase(); } );
}

/*
 * Put ellipsis in the middle of long text
 */
export function ellipsisLongText(str:string) : string
{
	if (str === null)
	{
		return '';
	}

	if (str.length > 65)
	{
		return str.substr(0, 50) + '...' + str.substr(str.length-10, str.length);
	}

	return str;
}

/*
 * Get link for UT's reference
 */
export function getReferenceLink(ticket:UserTicketType|TicketType) : string
{
	const type = ticket.type.identifier;
	const types = constants.userTicket.types;

	if (ticket.reference.id === null)
	{
		return '';
	}

	if (type === types.thread)
	{
		if (ticket.reference.parentId != null)
		{
			return `/forums/${encodeURIComponent(ticket.reference.parentId)}`;
		}
	}
	else if (type === types.post || type === types.postImage)
	{
		if (ticket.reference.parentId != null)
		{
			return `/forums/${encodeURIComponent(ticket.reference.parentId)}`;
		}
	}
	else if (type === types.pattern)
	{
		return `/pattern/${encodeURIComponent(ticket.reference.id)}`;
	}
	else if (type === types.tune)
	{
		if (ticket.reference.text != null)
		{
			return `/town-tunes?name=${encodeURIComponent(ticket.reference.text)}&creator=${encodeURIComponent(ticket.violator.username)}`;
		}
	}
	else if (type === types.map || type === types.town || type === types.character || type === types.townTune || type === types.townFlag)
	{
		return `/profile/${encodeURIComponent(ticket.violator.id)}/towns`;
	}
	else if (type === types.listing)
	{
		return `/trading-post/${encodeURIComponent(ticket.reference.id)}`;
	}
	else if (type === types.listingComment || type === types.offer)
	{
		if (ticket.reference.parentId != null)
		{
			return `/trading-post/${encodeURIComponent(ticket.reference.parentId)}`;
		}
	}
	else if ([types.shopName, types.shopDescription, types.shopShortDescription, types.shopImage, types.shopServiceName, types.shopServiceDescription, types.shopRoleName, types.shopRoleDescription].includes(type))
	{
		if (ticket.reference.parentId != null)
		{
			return `/shop/${encodeURIComponent(ticket.reference.parentId)}`;
		}
	}
	else if ([types.shopOrder].includes(type))
	{
		return `/shop/order/${encodeURIComponent(ticket.reference.id)}`;
	}
	else if ([types.shopApplication].includes(type))
	{
		return `/shop/application/${encodeURIComponent(ticket.reference.id)}`;
	}
	else if (type.startsWith('profile_') || type === types.rating)
	{
		return `/profile/${encodeURIComponent(ticket.violator.id)}`;
	}

	return '';
}

/*
 * Get default map for each AC game.
 */
export function getDefaultMapAcres(gameId:number) : number[]|null
{
	switch (gameId)
	{
		case constants.gameIds.ACGC:
			return [148, 149, 150, 151, 152, 0, 0, 139, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 143, 143, 143, 143, 145];
		case constants.gameIds.ACWW:
			return [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 8, 8, 8];
		case constants.gameIds.ACCF:
			return [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 99, 99, 99, 99, 99];
		case constants.gameIds.ACNL:
			return [154, 153, 155, 151, 156, 0, 0, 13, 0, 77, 0, 0, 0, 0, 77, 0, 0, 0, 0, 98, 125, 86, 86, 107, 97];
		case constants.gameIds.ACNH:
			return null;
	}

	return null;
}

/*
 * Special words that will be replaced in scout templates
 */
export function getScoutTemplateConfig(scout:UserLiteType, adoptee:UserType) : {character: string, replace: string}[]
{
	return [
		{ character: 'ScoutName', replace: scout?.username },
		{ character: 'AdopteeName', replace: adoptee?.username },
		{ character: 'ScoutId', replace: String(scout?.id || '') },
		{ character: 'AdopteeId', replace: String(adoptee?.id || '') },
	];
}

/*
 * Get password reset email.
 */
export function getPasswordResetEmail(link:string, orgEmail:string) : string
{
	const vbnewline = '<br/>';

	const origSendTo = constants.LIVE_SITE ? '' : `Originally sending to: ${orgEmail}${vbnewline}${vbnewline}`;

	let email = `Welcome to Animal Crossing Community. Thanks for joining us, and welcome aboard! Click the link below to confirm your email address and choose a password.${vbnewline}${vbnewline}`;

	email += `${link}${vbnewline}${vbnewline}`;

	email += `If you didn't sign up to ACC, please ignore this email or reply to let us know. This link is only valid for the next 24 hours.${vbnewline}${vbnewline}`;

	return '<span style="font-family: Verdana; font-size: 11px;">'+origSendTo+email+'</span>';
}

/*
 * For Permissions.
 * Recursively get children boards of each board.
 */
export function getChildBoards(boardPermissions:any[], parentId:string|null)
{
	const boards = boardPermissions.filter(bp => bp.parent_id === parentId);
	let returnBoardPerms:any = [];

	for (let board of boards)
	{
		let found = returnBoardPerms.find((b:any) => b.id === board.node_id);

		if (!found)
		{
			returnBoardPerms.push({
				id: board.node_id,
				name: board.title,
				parentId: board.parent_id,
				grantedTypes: [{
					id: board.node_permission_id,
					granted: board.granted,
					identifier: board.identifier,
				}],
			});

			continue;
		}

		found.grantedTypes.push({
			id: board.node_permission_id,
			granted: board.granted,
			identifier: board.identifier,
		});
	}

	for (let board of returnBoardPerms)
	{
		board.boards = getChildBoards(boardPermissions, board.id);
	}

	return returnBoardPerms;
}

/**
 * For Notifications.
 */
export function getNotificationReferenceLink(notification:any, userCheck:boolean, currentUserId:number, extra:any) : string
{
	const type = notification.identifier;

	if (
		[
			constants.notification.types.FB
		].includes(type)
	)
	{
		if (notification.child_reference_id)
		{
			return `/forums/${encodeURIComponent(notification.child_reference_id)}`;
		}

		return `/forums/${encodeURIComponent(notification.reference_id)}`;
	}
	else if (
		[
			constants.notification.types.PT,
			constants.notification.types.FT,
			constants.notification.types.usernameTag
		].includes(type)
	)
	{
		let url = `/forums/${encodeURIComponent(extra.parentId)}/${encodeURIComponent(extra.page)}`;

		if (extra.post)
		{
			url += `#${extra.post}`;
		}

		return url;
	}
	else if (
		[
			constants.notification.types.scoutAdoption,
			constants.notification.types.scoutThread,
			constants.notification.types.scoutClosed,
			constants.notification.types.scoutBT
		].includes(type)
	)
	{
		return `/scout-hub/adoption/${encodeURIComponent(notification.reference_id)}`;
	}
	else if (type === constants.notification.types.scoutFeedback)
	{
		return `/scout-hub/ratings/${encodeURIComponent(currentUserId)}`;
	}
	else if (
		[
			constants.notification.types.listingCancelled,
			constants.notification.types.listingExpired,
			constants.notification.types.listingComment,
			constants.notification.types.listingOffer,
			constants.notification.types.listingOfferAccepted,
			constants.notification.types.listingOfferRejected,
			constants.notification.types.listingOfferCancelled,
			constants.notification.types.listingContact,
			constants.notification.types.listingCompleted,
			constants.notification.types.listingFailed,
			constants.notification.types.listingFeedback
		].includes(type)
	)
	{
		return `/trading-post/${encodeURIComponent(notification.reference_id)}`;
	}
	else if (
		[
			constants.notification.types.modminUT,
			constants.notification.types.modminUTMany,
			constants.notification.types.modminUTDiscussion
		].includes(type)
	)
	{
		return `/user-ticket/${encodeURIComponent(notification.reference_id)}`;
	}
	else if (type === constants.notification.types.modminUTPost)
	{
		if (userCheck)
		{
			return `/user-ticket/${encodeURIComponent(notification.reference_id)}`;
		}

		return `/ticket/${encodeURIComponent(notification.reference_id)}`;
	}
	else if (
		[
			constants.notification.types.ticketProcessed
		].includes(type)
	)
	{
		return `/ticket/${encodeURIComponent(notification.reference_id)}`;
	}
	else if (
		[
			constants.notification.types.supportTicket,
			constants.notification.types.supportTicketProcessed,
		].includes(type)
	)
	{
		return `/support-ticket/${encodeURIComponent(notification.reference_id)}`;
	}
	else if (
		[
			constants.notification.types.feature,
			constants.notification.types.featurePost,
			constants.notification.types.followFeature
		].includes(type)
	)
	{
		return `/feature/${encodeURIComponent(notification.reference_id)}`;
	}
	else if (
		[
			constants.notification.types.supportEmail
		].includes(type)
	)
	{
		return `/support-email/${encodeURIComponent(notification.reference_id)}`;
	}
	else if (
		[
			constants.notification.types.giftBellShop
		].includes(type)
	)
	{
		return `/bell-shop/redeemed`;
	}
	else if (
		[
			constants.notification.types.giftDonation
		].includes(type)
	)
	{
		return `/profile/${encodeURIComponent(currentUserId)}`;
	}
	else if (type === constants.notification.types.shopThread)
	{
		let url = `/shops/threads/${encodeURIComponent(extra.parentId)}/${encodeURIComponent(extra.page)}`;

		if (extra.post)
		{
			url += `#${extra.post}`;
		}

		return url;
	}
	else if (type === constants.notification.types.shopEmployee)
	{
		return `/shop/${encodeURIComponent(notification.reference_id)}`;
	}
	else if (type === constants.notification.types.shopOrder)
	{
		return `/shop/order/${encodeURIComponent(notification.reference_id)}`;
	}
	else if (type === constants.notification.types.shopApplication)
	{
		return `/shop/application/${encodeURIComponent(notification.reference_id)}`;
	}
	else if (type === constants.notification.types.donationReminder)
	{
		return `/donate`;
	}

	return '';
}

/**
 * For Global Notifications.
 */
export function getGlobalNotificationReferenceLink(notification:any) : string
{
	const type = notification.identifier;

	if ([constants.notification.types.announcement].includes(type))
	{
		return `/forums/${encodeURIComponent(notification.reference_id)}`;
	}

	return '';
}

export function getRandomColor() : string
{
	return '#'+(Math.random()*0xFFFFFF<<0).toString(16);
}

export function startLog(request:any, location:string) : string
{
	let ipAddresses:string|string[] = request.headers['x-forwarded-for'];
	let protocol:string = request.headers['x-forwarded-proto'];
	let httpVersion:string = request.httpVersion;
	let tls = 'true';
	let tlsVersion:string|string[] = 'unknown';

	if (request.headers['cloudfront-viewer-address'])
	{
		ipAddresses = request.headers['cloudfront-viewer-address'].split(':');

		if (ipAddresses.length > 1)
		{
			(ipAddresses as string[]).pop();
			ipAddresses = (ipAddresses as string[]).join(':');
		}
	}

	if (request.headers['cloudfront-forwarded-proto'])
	{
		protocol = request.headers['cloudfront-forwarded-proto'];
	}

	if (request.headers['cloudfront-viewer-http-version'])
	{
		httpVersion = request.headers['cloudfront-viewer-http-version'];
	}

	if (request.headers['cloudfront-viewer-tls'])
	{
		tlsVersion = request.headers['cloudfront-viewer-tls'].split(':');

		if (tlsVersion.length === 3)
		{
			(tlsVersion as string[]).pop();
			(tlsVersion as string[]).pop();
		}
	}

	let log = `at=info method=${request.method} path="${request.url}" host=${request.headers['host']} request_id=${request.headers['x-request-id']} fwd="${ipAddresses}" protocol=${protocol} tls=${tls} tls_version=${tlsVersion} location=${location} http_version=${httpVersion} user_agent="${request.headers['user-agent']}" referer=${request.headers['referer']}`;

	if (request.session.user)
	{
		log += ` user_id=${request.session.user}`;
	}

	if (request.session.username)
	{
		log += ` user_name=${request.session.username}`;
	}

	if (request.headers['cloudfront-viewer-country-name'])
	{
		log += ` country_name=${request.headers['cloudfront-viewer-country-name']}`;
	}

	if (request.headers['x-host'])
	{
		log += ` x_host=${request.headers['x-host']}`;
	}

	log += ` version=${constants.version}`;

	return log;
}

export function isNumber(value:any) : boolean
{
	return !isNaN(value);
}