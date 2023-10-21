import PropTypes from 'prop-types';

const catalogGroupItemsShape = PropTypes.shape({
	id: PropTypes.string,
	name: PropTypes.string,
	position: PropTypes.number,
	categoryName: PropTypes.string,
	museum: PropTypes.bool,
	genuine: PropTypes.bool,
	tradeable: PropTypes.bool,
});

export default catalogGroupItemsShape;