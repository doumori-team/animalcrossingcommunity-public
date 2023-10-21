import PropTypes from 'prop-types';

import characterShape from './character-shape.js';
import residentShape from './resident-shape.js';
import patternShape from '../pattern-shape.js';
import tuneShape from '../tune-shape.js';

const townShape = PropTypes.shape({
	id: PropTypes.number,
	name: PropTypes.string,
	game: PropTypes.shape({
		id: PropTypes.number,
		name: PropTypes.string,
		shortname: PropTypes.string,
		mapX: PropTypes.number,
		mapY: PropTypes.number,
		identifier: PropTypes.string,
	}),
	userId: PropTypes.number,
	grassShape: PropTypes.shape({
		id: PropTypes.number,
		name: PropTypes.string,
	}),
	dreamAddress: PropTypes.string,
	ordinance: PropTypes.shape({
		id: PropTypes.number,
		name: PropTypes.string,
	}),
	hemisphere: PropTypes.shape({
		id: PropTypes.number,
		name: PropTypes.string,
	}),
	fruit: PropTypes.arrayOf(PropTypes.shape({
		id: PropTypes.number,
		name: PropTypes.string,
		group: PropTypes.string,
	})),
	nativeFruit: PropTypes.shape({
		all: PropTypes.arrayOf(PropTypes.shape({
			id: PropTypes.number,
			name: PropTypes.string,
			group: PropTypes.string,
		})),
		regular: PropTypes.arrayOf(PropTypes.shape({
			id: PropTypes.number,
			name: PropTypes.string,
			group: PropTypes.string,
		})),
		island1: PropTypes.arrayOf(PropTypes.shape({
			id: PropTypes.number,
			name: PropTypes.string,
			group: PropTypes.string,
		})),
		island2: PropTypes.arrayOf(PropTypes.shape({
			id: PropTypes.number,
			name: PropTypes.string,
			group: PropTypes.string,
		})),
		special: PropTypes.arrayOf(PropTypes.shape({
			id: PropTypes.number,
			name: PropTypes.string,
			group: PropTypes.string,
		})),
		nativeFruitId: PropTypes.number,
		islandFruitId1: PropTypes.number,
		islandFruitId2: PropTypes.number,
	}),
	stores: PropTypes.shape({
		nook: PropTypes.arrayOf(PropTypes.shape({
			id: PropTypes.number,
			name: PropTypes.string,
			group: PropTypes.string,
		})),
		others: PropTypes.arrayOf(PropTypes.shape({
			id: PropTypes.number,
			name: PropTypes.string,
			group: PropTypes.string,
		})),
	}),
	pwps: PropTypes.arrayOf(PropTypes.shape({
		id: PropTypes.string,
		name: PropTypes.string,
	})),
	residents: PropTypes.arrayOf(residentShape),
	island: PropTypes.shape({
		id: PropTypes.number,
		name: PropTypes.string,
		resident: residentShape,
	}),
	characters: PropTypes.arrayOf(characterShape),
	mapTiles: PropTypes.arrayOf(PropTypes.number),
	tune: tuneShape,
	museum: PropTypes.arrayOf(PropTypes.shape({
		count: PropTypes.number,
		total: PropTypes.number,
		name: PropTypes.string,
	})),
	mapDesignData: PropTypes.shape({
		dataUrl: PropTypes.string,
		colorData: PropTypes.arrayOf(PropTypes.string),
		cursorData: PropTypes.arrayOf(PropTypes.string),
		flipData: PropTypes.arrayOf(PropTypes.string),
		imageData: PropTypes.arrayOf(PropTypes.string),
	}),
	flag: patternShape,
});

export default townShape;
