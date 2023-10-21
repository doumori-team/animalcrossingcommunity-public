import PropTypes from 'prop-types';

const categoryShape = PropTypes.shape({
	id: PropTypes.number.isRequired,
	name: PropTypes.string.isRequired
})

export default categoryShape;