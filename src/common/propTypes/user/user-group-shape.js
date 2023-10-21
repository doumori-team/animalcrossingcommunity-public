import PropTypes from 'prop-types';

const userGroupShape = PropTypes.shape({
	id: PropTypes.number,
	identifier: PropTypes.string,
	name: PropTypes.string,
});

export default userGroupShape;