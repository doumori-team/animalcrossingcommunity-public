import PropTypes from 'prop-types';

const characterGameShape = PropTypes.shape({
	info: PropTypes.shape({
		id: PropTypes.number,
		name: PropTypes.string,
		shortname: PropTypes.string,
		hasTown: PropTypes.bool,
		maxResidents: PropTypes.number,
	}),
	houseSizes: PropTypes.arrayOf(PropTypes.shape({
		groupId: PropTypes.number,
		groupName: PropTypes.string,
		houseSizes: PropTypes.arrayOf(PropTypes.shape({
			id: PropTypes.number,
			name: PropTypes.string,
		})),
	})),
	bedLocations: PropTypes.arrayOf(PropTypes.shape({
		id: PropTypes.number,
		filename: PropTypes.string,
	})),
	faces: PropTypes.arrayOf(PropTypes.shape({
		id: PropTypes.number,
		filename: PropTypes.string,
	})),
});

export default characterGameShape;