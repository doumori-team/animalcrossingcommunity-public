import * as db from '@db';
import { UserError } from '@errors';
import { utils, constants, dateUtils } from '@utils';
import { APIThisType } from '@types';

// Common
export const string = 'string';
export const number = 'number';
export const boolean = 'boolean';
export const array = 'array';
export const multiArray = 'multiArray';
export const regex = 'regex';
export const date = 'date';
export const wholeNumber = 'wholeNumber';
export const uuid = 'uuid';

// ACC Unique
export const patternId = 'patternId';
export const acgameId = 'acgameId';
export const gameId = 'gameId';
export const gameConsoleId = 'gameConsoleId';
export const pollId = 'pollId';
export const userTicketId = 'userTicketId';
export const ruleId = 'ruleId';
export const ruleViolationId = 'ruleViolationId';
export const nodeId = 'nodeId';
export const townId = 'townId';
export const characterId = 'characterId';
export const userId = 'userId';
export const listingId = 'listingId';

export async function parse(this: APIThisType, apiTypes:any, params:any)
{
	let newParams = {...params};

	await Promise.all(Object.keys(apiTypes).map(async paramType => {
		const apiType = apiTypes[paramType];
		const param = params[paramType];
		let newParam = param;

		switch (apiType.type)
		{
			// Common
			case string:
				newParam = utils.trimString(apiType.hasOwnProperty('default') ?
					String(newParam || apiType.default) :
					String(newParam));

				if (apiType.hasOwnProperty('nullable') && apiType.nullable)
				{
					if (newParam === null)
					{
						break;
					}
					else if (newParam === undefined || utils.realStringLength(newParam) === 0)
					{
						newParam = null;

						break;
					}
				}

				if (apiType.hasOwnProperty('length'))
				{
					if (utils.realStringLength(newParam) > apiType.length)
					{
						throw new UserError('bad-format');
					}
				}

				if (apiType.hasOwnProperty('min'))
				{
					if (utils.realStringLength(newParam) < apiType.min)
					{
						throw new UserError('bad-format');
					}
				}

				if (apiType.hasOwnProperty('regex'))
				{
					if (utils.realStringLength(newParam) > 0 && !newParam.match(RegExp(apiType.regex)))
					{
						throw new UserError('bad-format');
					}
				}

				if (utils.realStringLength(newParam) > 0 && apiType.hasOwnProperty('includes'))
				{
					if (!apiType.includes.includes(newParam))
					{
						throw new UserError('bad-format');
					}
				}
				else if (apiType.hasOwnProperty('profanity') && apiType.profanity)
				{
					await this.query('v1/profanity/check', {text: newParam});
				}

				break;
			case uuid:
				newParam = utils.trimString(String(newParam || ''));

				if (utils.realStringLength(newParam) > 0 && !newParam.match(RegExp(constants.regexes.uuid)))
				{
					const error = apiType.hasOwnProperty('error') ? apiType.error : 'bad-format';

					throw new UserError(error);
				}

				break;
			case regex:
				newParam = utils.trimString(String(newParam || ''));

				if (apiType.hasOwnProperty('nullable') && apiType.nullable)
				{
					if (newParam === null)
					{
						break;
					}
					else if (newParam === undefined || utils.realStringLength(newParam) === 0)
					{
						newParam = null;

						break;
					}
				}

				if (utils.realStringLength(newParam) > 0 && !newParam.match(RegExp(apiType.regex)))
				{
					const error = apiType.hasOwnProperty('error') ? apiType.error : 'bad-format';

					throw new UserError(error);
				}

				break;
			case number:
				if (apiType.hasOwnProperty('nullable') && apiType.nullable)
				{
					if (newParam === null)
					{
						break;
					}
					else if (newParam === undefined || utils.realStringLength(newParam) === 0)
					{
						newParam = null;

						break;
					}
				}

				newParam = apiType.hasOwnProperty('default') ?
					Number(newParam || apiType.default) :
					Number(newParam);

				if (apiType.hasOwnProperty('min'))
				{
					if (newParam < apiType.min)
					{
						throw new UserError('bad-format');
					}
				}

				if (apiType.hasOwnProperty('max'))
				{
					if (newParam > apiType.max)
					{
						throw new UserError('bad-format');
					}
				}

				break;
			case wholeNumber:
				newParam = (apiType.hasOwnProperty('default') ?
					Number(newParam || apiType.default) :
					Number(newParam));

				if (!RegExp(constants.regexes.wholeNumber).test(newParam))
				{
					throw new UserError('bad-format');
				}

				if (apiType.hasOwnProperty('max'))
				{
					if (newParam > apiType.max)
					{
						throw new UserError('bad-format');
					}
				}

				break;
			case boolean:
				newParam = utils.trimString(apiType.hasOwnProperty('default') ?
					String(newParam || apiType.default) :
					String(newParam)).toLowerCase();

				if (!['true', 'false'].includes(newParam))
				{
					throw new UserError('bad-format');
				}
				else
				{
					newParam = newParam === 'true';
				}

				break;
			case array:
				if (!Array.isArray(newParam))
				{
					if (newParam)
					{
						newParam = newParam.split(',');
					}
					else
					{
						newParam = [];
					}
				}

				break;
			case multiArray:
				if (!Array.isArray(newParam))
				{
					if (newParam)
					{
						newParam = newParam.split(',');
					}
					else
					{
						newParam = [];
					}
				}

				newParam = newParam.map((np:any) => {
					if (!Array.isArray(np))
					{
						if (np)
						{
							return np.split(',');
						}
						else
						{
							return [];
						}
					}

					return np;
				});

				break;
			case date:
				newParam = utils.trimString(apiType.hasOwnProperty('default') ?
					String(newParam || apiType.default) :
					String(newParam));

				if (dateUtils.isValid(newParam))
				{
					newParam = dateUtils.formatYearMonthDay(newParam);
				}
				else if (apiType.hasOwnProperty('nullable') && apiType.nullable)
				{
					newParam = null;
				}

				break;
			// ACC Unique
			case patternId:
				if (apiType.hasOwnProperty('nullable') && apiType.nullable)
				{
					if (newParam === null || newParam === undefined || newParam == 0)
					{
						newParam = Number(newParam ||
							(apiType.hasOwnProperty('default') ?
								apiType.default :
								0));

						break;
					}
				}

				newParam = Number(newParam ||
					(apiType.hasOwnProperty('default') ?
						apiType.default :
						0));

				if (isNaN(newParam))
				{
					throw new UserError('no-such-pattern');
				}

				const [checkPatternId] = await db.query(`
					SELECT id
					FROM pattern
					WHERE id = $1::int
				`, newParam);

				if (!checkPatternId)
				{
					throw new UserError('no-such-pattern');
				}

				break;
			case acgameId:
				if (apiType.hasOwnProperty('nullable') && apiType.nullable)
				{
					// some searches, like TP and Shops, use -1 for 'all'
					if (newParam === null || newParam === undefined || newParam == 0 || newParam == -1)
					{
						newParam = Number(newParam ||
							(apiType.hasOwnProperty('default') ?
								apiType.default :
								0));

						break;
					}
				}

				newParam = Number(newParam ||
					(apiType.hasOwnProperty('default') ?
						apiType.default :
						0));

				if (isNaN(newParam))
				{
					throw new UserError('no-such-ac-game');
				}

				const [checkAcgameId] = await db.query(`
					SELECT id
					FROM ac_game
					WHERE id = $1::int
				`, newParam);

				if (!checkAcgameId)
				{
					throw new UserError('no-such-ac-game');
				}

				break;
			case gameId:
				if (apiType.hasOwnProperty('nullable') && apiType.nullable)
				{
					if (newParam === null || newParam === undefined || newParam == 0)
					{
						newParam = Number(newParam ||
							(apiType.hasOwnProperty('default') ?
								apiType.default :
								0));

						break;
					}
				}

				newParam = Number(newParam ||
					(apiType.hasOwnProperty('default') ?
						apiType.default :
						0));

				if (isNaN(newParam))
				{
					throw new UserError('no-such-game');
				}

				const [checkGameId] = await db.query(`
					SELECT id
					FROM game
					WHERE id = $1::int
				`, newParam);

				if (!checkGameId)
				{
					throw new UserError('no-such-game');
				}

				break;
			case gameConsoleId:
				if (apiType.hasOwnProperty('nullable') && apiType.nullable)
				{
					if (newParam === null || newParam === undefined || newParam == 0)
					{
						newParam = Number(newParam ||
							(apiType.hasOwnProperty('default') ?
								apiType.default :
								0));

						break;
					}
				}

				newParam = Number(newParam ||
					(apiType.hasOwnProperty('default') ?
						apiType.default :
						0));

				if (isNaN(newParam))
				{
					throw new UserError('no-such-game-console');
				}

				const [checkConsoleId] = await db.query(`
					SELECT
						id
					FROM game_console
					WHERE game_console.id = $1::int
				`, newParam);

				if (!checkConsoleId)
				{
					throw new UserError('no-such-game-console');
				}

				break;
			case pollId:
				if (apiType.hasOwnProperty('nullable') && apiType.nullable)
				{
					if (newParam === null || newParam === undefined || newParam == 0)
					{
						newParam = Number(newParam ||
							(apiType.hasOwnProperty('default') ?
								apiType.default :
								0));

						break;
					}
				}

				newParam = Number(newParam ||
					(apiType.hasOwnProperty('default') ?
						apiType.default :
						0));

				if (isNaN(newParam))
				{
					throw new UserError('no-such-poll');
				}

				const [checkPollId] = await db.query(`
					SELECT
						id
					FROM poll
					WHERE poll.id = $1::int
				`, newParam);

				if (!checkPollId)
				{
					throw new UserError('no-such-poll');
				}

				break;
			case userTicketId:
				if (apiType.hasOwnProperty('nullable') && apiType.nullable)
				{
					if (newParam === null || newParam === undefined || newParam == 0)
					{
						newParam = Number(newParam ||
							(apiType.hasOwnProperty('default') ?
								apiType.default :
								0));

						break;
					}
				}

				newParam = Number(newParam ||
					(apiType.hasOwnProperty('default') ?
						apiType.default :
						0));

				if (isNaN(newParam))
				{
					throw new UserError('no-such-user-ticket');
				}

				const [checkUTId] = await db.query(`
					SELECT
						id
					FROM user_ticket
					WHERE user_ticket.id = $1::int
				`, newParam);

				if (!checkUTId)
				{
					throw new UserError('no-such-user-ticket');
				}

				break;
			case ruleId:
				if (apiType.hasOwnProperty('nullable') && apiType.nullable)
				{
					if (newParam === null || newParam === undefined || newParam == 0)
					{
						newParam = Number(newParam ||
							(apiType.hasOwnProperty('default') ?
								apiType.default :
								0));

						break;
					}
				}

				newParam = Number(newParam ||
					(apiType.hasOwnProperty('default') ?
						apiType.default :
						0));

				if (isNaN(newParam))
				{
					throw new UserError('no-such-rule');
				}

				const [checkRuleId] = await db.query(`
					SELECT
						id
					FROM rule
					WHERE rule.id = $1::int
				`, newParam);

				if (!checkRuleId)
				{
					throw new UserError('no-such-rule');
				}

				break;
			case ruleViolationId:
				if (apiType.hasOwnProperty('nullable') && apiType.nullable)
				{
					if (newParam === null || newParam === undefined || newParam == 0)
					{
						newParam = Number(newParam ||
							(apiType.hasOwnProperty('default') ?
								apiType.default :
								0));

						break;
					}
				}

				newParam = Number(newParam ||
					(apiType.hasOwnProperty('default') ?
						apiType.default :
						0));

				if (isNaN(newParam))
				{
					throw new UserError('no-such-rule-violation');
				}

				const [checkViolationId] = await db.query(`
					SELECT
						id
					FROM rule_violation
					WHERE rule_violation.id = $1::int
				`, newParam);

				if (!checkViolationId)
				{
					throw new UserError('no-such-rule-violation');
				}

				break;
			case nodeId:
				if (apiType.hasOwnProperty('nullable') && apiType.nullable)
				{
					if (newParam === null || newParam === undefined || newParam == 0)
					{
						newParam = Number(newParam ||
							(apiType.hasOwnProperty('default') ?
								apiType.default :
								0));

						break;
					}
				}

				newParam = Number(newParam ||
					(apiType.hasOwnProperty('default') ?
						apiType.default :
						0));

				if (isNaN(newParam))
				{
					throw new UserError('no-such-node');
				}

				const [checkNodeId] = await db.query(`
					SELECT
						id
					FROM node
					WHERE node.id = $1::int
				`, newParam);

				if (!checkNodeId)
				{
					throw new UserError('no-such-node');
				}

				break;
			case townId:
				if (apiType.hasOwnProperty('nullable') && apiType.nullable)
				{
					if (newParam === null || newParam === undefined || newParam == 0)
					{
						newParam = Number(newParam ||
							(apiType.hasOwnProperty('default') ?
								apiType.default :
								0));

						break;
					}
				}

				newParam = Number(newParam ||
					(apiType.hasOwnProperty('default') ?
						apiType.default :
						0));

				if (isNaN(newParam))
				{
					throw new UserError('no-such-town');
				}

				const [checkTownId] = await db.query(`
					SELECT
						id
					FROM town
					WHERE town.id = $1::int
				`, newParam);

				if (!checkTownId)
				{
					throw new UserError('no-such-town');
				}

				break;
			case characterId:
				if (apiType.hasOwnProperty('nullable') && apiType.nullable)
				{
					if (newParam === null || newParam === undefined || newParam == 0)
					{
						newParam = Number(newParam ||
							(apiType.hasOwnProperty('default') ?
								apiType.default :
								0));

						break;
					}
				}

				newParam = Number(newParam ||
					(apiType.hasOwnProperty('default') ?
						apiType.default :
						0));

				if (isNaN(newParam))
				{
					throw new UserError('no-such-character');
				}

				const [checkCharacterId] = await db.query(`
					SELECT
						id
					FROM character
					WHERE character.id = $1::int
				`, newParam);

				if (!checkCharacterId)
				{
					throw new UserError('no-such-character');
				}

				break;
			case userId:
				if (apiType.hasOwnProperty('nullable') && apiType.nullable)
				{
					if (newParam === null || newParam === undefined || newParam == 0)
					{
						newParam = Number(newParam ||
							(apiType.hasOwnProperty('default') ?
								(apiType.default === true ? this.userId : apiType.default) :
								0));

						if (isNaN(newParam) || newParam === null || newParam === undefined || newParam == 0)
						{
							newParam = Number(newParam || 0);

							break;
						}
					}
				}

				newParam = Number(newParam ||
					(apiType.hasOwnProperty('default') ?
						(apiType.default === true ? this.userId : apiType.default) :
						0));

				await this.query('v1/user_lite', {id: newParam});

				break;
			case listingId:
				if (apiType.hasOwnProperty('nullable') && apiType.nullable)
				{
					if (newParam === null || newParam === undefined || newParam == 0)
					{
						newParam = Number(newParam ||
							(apiType.hasOwnProperty('default') ?
								apiType.default :
								0));

						break;
					}
				}

				newParam = Number(newParam ||
					(apiType.hasOwnProperty('default') ?
						apiType.default :
						0));

				if (isNaN(newParam))
				{
					throw new UserError('no-such-listing');
				}

				const [checkListingId] = await db.query(`
					SELECT
						id
					FROM listing
					WHERE listing.id = $1::int
				`, newParam);

				if (!checkListingId)
				{
					throw new UserError('no-such-listing');
				}

				break;
		}

		if (apiType.hasOwnProperty('required') && apiType.required)
		{
			const error = apiType.hasOwnProperty('error') ? apiType.error : 'bad-format';

			switch (apiType.type)
			{
				case string:
					if (utils.realStringLength(newParam) === 0)
					{
						throw new UserError(error);
					}

					break;
				case uuid:
					if (utils.realStringLength(newParam) === 0)
					{
						throw new UserError(error);
					}

					break;
				case number:
					if (apiType.hasOwnProperty('nullable') && apiType.nullable)
					{
						if (newParam === null || newParam === undefined)
						{
							break;
						}
					}

					if (isNaN(newParam) || newParam < 0)
					{
						throw new UserError(error);
					}

					if (apiType.hasOwnProperty('min'))
					{
						if (newParam < apiType.min)
						{
							throw new UserError('bad-format');
						}
					}

					break;
				case array:
				case multiArray:
					if (newParam === undefined || newParam.length === 0)
					{
						throw new UserError(error);
					}

					break;
				case date:
					if (!dateUtils.isValid(newParam))
					{
						throw new UserError(error);
					}

					break;
			}
		}

		newParams[paramType] = newParam;
	}));

	return newParams;
}