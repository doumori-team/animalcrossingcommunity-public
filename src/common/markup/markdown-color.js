'use strict';

var TOKEN_TYPE = 'color_text';
var MARKUP = "{color}";

function tokenize(state, silent)
{
	if (silent)
	{
		return false; // don't run any pairs in validation mode
	}

	const start = state.pos;
	let valueStart = state.pos + 6;

	// Check that this is a {color} tag
	if (state.src.slice(start, valueStart) !== '{color')
	{
		// ...or a {colour} tag :)
		valueStart++;
		if (state.src.slice(start, valueStart) !== '{colour')
		{
			return false;
		}
	}
	
	if (state.src.charCodeAt(valueStart) === 0x7D/* } */)
	{
		// This is a closing tag
		const token = state.push(TOKEN_TYPE, 'span', -1);
		token.markup = MARKUP;

		state.pos = valueStart + 1;
		return true;
	}

	if (state.src.charCodeAt(valueStart) === 0x3A/* : */)
	{
		// This is an opening tag
		const token = state.push(TOKEN_TYPE, 'span', 1);
		token.markup = MARKUP;

		const tagEnd = state.src.indexOf('}', valueStart + 2);
		if (tagEnd === -1)
		{
			return false;
		}

		const color = state.src.slice(valueStart + 1, tagEnd);
		token.attrSet('color', color);

		state.pos = tagEnd + 1;
		return true;
	}

	return false;
}

function render(tokens, idx)
{
	const token = tokens[idx];
	if (token.nesting === -1)
	{
		return '</font>';
	}
	else
	{
		const color = token.attrGet('color');
		return `<font color="${color}">`;
	}
}

export default function color(md)
{
	md.inline.ruler.after('emphasis', TOKEN_TYPE, tokenize);
	md.renderer.rules[TOKEN_TYPE] = render;
};
