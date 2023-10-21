import PropTypes from 'prop-types';

const catalogCategoriesShape = PropTypes.shape({
	categoryName: PropTypes.string,
	total: PropTypes.number,
	count: PropTypes.number,
});

export default catalogCategoriesShape;