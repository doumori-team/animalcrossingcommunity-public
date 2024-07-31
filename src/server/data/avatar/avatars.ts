import { utils } from '@utils';
import {
	DataBackgroundType,
	DataCharacterType,
	DataColorationType,
	DataAccentType
} from '@types';

import characters from './characters.json' assert { type: 'json'};
import accents from './accents.json' assert { type: 'json'};
import backgrounds from './backgrounds.json' assert { type: 'json'};
import colorations from './colorations.json' assert { type: 'json'};
import tags from './tags.json' assert { type: 'json'};

export const indexedAvatarCharacters = getIndexedCharacters();
export const alphabeticalAvatarCharacters = (characters as DataCharacterType[]).sort((a, b) => utils.sortingCollator.compare(a.name, b.name));
export const indexedAvatarAccents = getIndexedAccents();
export const alphabeticalAvatarAccents = (accents as DataAccentType[]).sort((a, b) => utils.sortingCollator.compare(a.name, b.name));
export const indexedAvatarBackgrounds = getIndexedBackgrounds();
export const alphabeticalAvatarBackgrounds = (backgrounds as DataBackgroundType[]).sort((a, b) => utils.sortingCollator.compare(a.name, b.name));
export const indexedAvatarColorations = getIndexedColorations();
export const alphabeticalAvatarColorations = (colorations as DataColorationType[]).sort((a, b) => utils.sortingCollator.compare(a.name, b.name));
export const avatarTags = tags;

function getIndexedCharacters() : DataCharacterType[]
{
	let indexedCharacters:DataCharacterType[] = [];

	characters.forEach(character =>
		indexedCharacters[character.id] = character
	);

	return indexedCharacters;
}

function getIndexedAccents() : DataAccentType[]
{
	let indexedAccents:DataAccentType[] = [];

	accents.forEach(accent =>
		indexedAccents[accent.id] = accent
	);

	return indexedAccents;
}

function getIndexedBackgrounds() : DataBackgroundType[]
{
	let indexedBackgrounds:DataBackgroundType[] = [];

	backgrounds.forEach(bg =>
		indexedBackgrounds[bg.id] = bg
	);

	return indexedBackgrounds;
}

function getIndexedColorations() : DataColorationType[]
{
	let indexedColorations:DataColorationType[] = [];

	colorations.forEach(coloration =>
		indexedColorations[coloration.id] = coloration
	);

	return indexedColorations;
}
