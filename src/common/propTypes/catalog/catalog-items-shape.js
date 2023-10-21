import PropTypes from 'prop-types';

const catalogItemsShape = PropTypes.shape({
	id: PropTypes.string,
	isInventory: PropTypes.bool,
	isWishlist: PropTypes.bool,
	inMuseum: PropTypes.bool,
});

export default catalogItemsShape;