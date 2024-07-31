'use strict';

const TOKEN_TYPE = 'center_text';
const MARKUP = '{center}';

function tokenize(state:any, silent:any) : boolean
{
	if (silent)
	{
		return false; // don't run any pairs in validation mode
	}

	const start = state.pos;
	const valueStart = state.pos + 8;

	if (state.src.slice(start, valueStart) !== '{center}')
	{
		return false;
	}

	const token = state.push(TOKEN_TYPE, 'span', 1);
	token.markup = MARKUP;

	state.pos = valueStart;

	return true;
}

function render(tokens:any, idx:any) : string
{
	const token = tokens[idx];

	if (token.nesting === -1)
	{
		return '</span>';
	}
	else
	{
		return `<span class='center-text'>`;
	}
}

export default function center(md:any) : void
{
	md.inline.ruler.after('emphasis', TOKEN_TYPE, tokenize);
	md.renderer.rules[TOKEN_TYPE] = render;
};