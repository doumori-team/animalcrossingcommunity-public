import PropTypes from 'prop-types';

import residentShape from './resident-shape.js';

const townGameShape = PropTypes.shape({
	info: PropTypes.shape({
		id: PropTypes.number,
		name: PropTypes.string,
		shortname: PropTypes.string,
		hasTown: PropTypes.bool,
		maxResidents: PropTypes.number,
	}),
	fruit: PropTypes.shape({
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
	}),
	grassShapes: PropTypes.arrayOf(PropTypes.shape({
		id: PropTypes.number,
		name: PropTypes.string,
	})),
	stores: PropTypes.shape({
		nooks: PropTypes.arrayOf(PropTypes.shape({
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
	hemispheres: PropTypes.arrayOf(PropTypes.shape({
		id: PropTypes.number,
		name: PropTypes.string,
	})),
});

export default townGameShape;