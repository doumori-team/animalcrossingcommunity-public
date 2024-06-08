import { utils } from '@utils';

import characters from './characters.json' assert { type: 'json'};
import accents from './accents.json' assert { type: 'json'};
import backgrounds from './backgrounds.json' assert { type: 'json'};
import colorations from './colorations.json' assert { type: 'json'};
import tags from './tags.json' assert { type: 'json'};

export const indexedAvatarCharacters = getIndexedCharacters();
export const alphabeticalAvatarCharacters = characters.sort((a, b) => utils.sortingCollator.compare(a.name, b.name));
export const indexedAvatarAccents = getIndexedAccents();
export const alphabeticalAvatarAccents = accents.sort((a, b) => utils.sortingCollator.compare(a.name, b.name));
export const indexedAvatarBackgrounds = getIndexedBackgrounds();
export const alphabeticalAvatarBackgrounds = backgrounds.sort((a, b) => utils.sortingCollator.compare(a.name, b.name));
export const indexedAvatarColorations = getIndexedColorations();
export const alphabeticalAvatarColorations = colorations.sort((a, b) => utils.sortingCollator.compare(a.name, b.name));
export const avatarTags = tags;

function getIndexedCharacters()
{
	let indexedCharacters = [];

	characters.forEach(character =>
		indexedCharacters[character.id] = character
	);

	return indexedCharacters;
}

function getIndexedAccents()
{
	let indexedAccents = [];

	accents.forEach(accent =>
		indexedAccents[accent.id] = accent
	);

	return indexedAccents;
}

function getIndexedBackgrounds()
{
	let indexedBackgrounds = [];

	backgrounds.forEach(bg =>
		indexedBackgrounds[bg.id] = bg
	);

	return indexedBackgrounds;
}

function getIndexedColorations()
{
	let indexedColorations = [];

	colorations.forEach(coloration =>
		indexedColorations[coloration.id] = coloration
	);

	return indexedColorations;
}
