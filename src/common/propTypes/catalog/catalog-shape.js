import PropTypes from 'prop-types';

import catalogGroupItemsShape from './catalog-group-items-shape.js';

const catalogShape = PropTypes.shape({
	categoryName: PropTypes.name,
	total: PropTypes.number,
	count: PropTypes.number,
	groups: PropTypes.arrayOf(PropTypes.shape({
		groupName: PropTypes.string,
		total: PropTypes.number,
		items: PropTypes.arrayOf(catalogGroupItemsShape),
	})),
});

export default catalogShape;