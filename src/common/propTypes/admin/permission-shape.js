import PropTypes from 'prop-types';

export default PropTypes.shape({
	site: PropTypes.arrayOf(PropTypes.shape({
		id: PropTypes.number,
		description: PropTypes.string,
		granted: PropTypes.bool,
	})),
	forum: PropTypes.shape({
		types: PropTypes.arrayOf(PropTypes.shape({
			id: PropTypes.number,
			description: PropTypes.string,
		})),
		boards: PropTypes.arrayOf(PropTypes.shape({
			id: PropTypes.number,
			name: PropTypes.string,
			parentId: PropTypes.number,
			grantedTypes: PropTypes.arrayOf(PropTypes.shape({
				id: PropTypes.number,
				granted: PropTypes.bool,
				identifier: PropTypes.string,
			})),
			boards: PropTypes.array, // recursive of itself
		}))
	}),
});