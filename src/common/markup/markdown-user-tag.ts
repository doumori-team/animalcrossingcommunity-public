'use strict';
import { stringAt } from './utils.ts';
import { convertForUrl } from 'common/utils/utils.ts';
import { regexes } from 'common/utils/constants.ts';

let TOKEN_TYPE = 'user_tag';

function tokenize(state: any, silent: any): boolean
{
	if (silent)
	{
		return false; // don't run any pairs in validation mode
	}

	const start = state.pos;
	const valueStart = start + 1;

	if (state.src.slice(start, valueStart) !== '@')
	{
		return false;
	}

	const end = state.src.indexOf(' ', start);
	const unmatched = end > 0 ? state.src.slice(start, end) : state.src.slice(start);

	const matches = unmatched.match(RegExp(regexes.userTag));

	if (!matches)
	{
		return false;
	}

	const emailMatches = `test${unmatched}`.match(RegExp(regexes.email));

	if (emailMatches)
	{
		return false;
	}

	const token = state.push(TOKEN_TYPE, 'a', 1);

	const username = matches[1];
	token.attrSet('username', username);

	const lastCharacter = stringAt(unmatched, -1);
	const endIsNonWordChar = (lastCharacter as any).match(/\W/g);

	if (endIsNonWordChar)
	{
		token.attrSet('lastCharacter', lastCharacter);
		state.pos = state.src.indexOf(username, valueStart) + username.length + 1;
	}
	else
	{
		token.attrSet('lastCharacter', '');
		state.pos = state.src.indexOf(username, valueStart) + username.length;
	}

	return true;
}

function render(tokens: any, idx: any): string
{
	const token = tokens[idx];
	const username = token.attrGet('username');
	const lastCharacter = token.attrGet('lastCharacter');

	return `<a href="/profile/${convertForUrl(username)}">@${username}</a>${lastCharacter}`;
}

export default function userTag(md: any): void
{
	md.inline.ruler.after('emphasis', TOKEN_TYPE, tokenize);
	md.renderer.rules[TOKEN_TYPE] = render;
};
