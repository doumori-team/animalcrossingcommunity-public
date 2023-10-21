import PropTypes from 'prop-types';

import userShape from '../user/user-shape.js';
import userLiteShape from '../user/user-lite-shape.js';
import residentShape from '../town/resident-shape.js';

export default PropTypes.shape({
	id: PropTypes.number,
	creator: userShape,
	formattedDate: PropTypes.any,
	game: PropTypes.shape({
		id: PropTypes.number,
		name: PropTypes.string,
		shortname: PropTypes.string,
		hasTown: PropTypes.bool,
		maxResidents: PropTypes.number,
	}),
	offers: PropTypes.shape({
		total: PropTypes.number,
		accepted: PropTypes.shape({
			id: PropTypes.number,
			user: userShape,
			formattedDate: PropTypes.any,
			status: PropTypes.string,
			bells: PropTypes.number,
			items: PropTypes.arrayOf(PropTypes.shape({
				id: PropTypes.string,
				quantity: PropTypes.number,
				secretCode: PropTypes.string,
				name: PropTypes.string,
			})),
			residents: PropTypes.arrayOf(residentShape),
			comment: PropTypes.string,
			rating: PropTypes.shape({
				id: PropTypes.number,
				username: PropTypes.string,
				formattedDate: PropTypes.string,
				rating: PropTypes.string,
				comment: PropTypes.string,
				listingId: PropTypes.number,
			}),
			character: PropTypes.shape({
				id: PropTypes.number,
				name: PropTypes.string,
				town: PropTypes.shape({
					id: PropTypes.number,
					name: PropTypes.string,
				}),
			}),
			friendCode: PropTypes.string,
			dodoCode: PropTypes.string,
			completed: PropTypes.bool,
			failed: PropTypes.bool,
			address: PropTypes.string,
			bioLocation: PropTypes.string,
		}),
		list: PropTypes.arrayOf(PropTypes.shape({
			id: PropTypes.number,
			user: userShape,
			formattedDate: PropTypes.any,
			status: PropTypes.string,
			bells: PropTypes.number,
			items: PropTypes.arrayOf(PropTypes.shape({
				id: PropTypes.string,
				quantity: PropTypes.number,
				secretCode: PropTypes.string,
				name: PropTypes.string,
			})),
			residents: PropTypes.arrayOf(residentShape),
			comment: PropTypes.string,
			bioLocation: PropTypes.string,
		})),
	}),
	comments: PropTypes.arrayOf(PropTypes.shape({
		id: PropTypes.number,
		user: userLiteShape,
		formattedDate: PropTypes.any,
		comment: PropTypes.string,
	})),
	formattedLastUpdated: PropTypes.any,
	bells: PropTypes.number,
	items: PropTypes.arrayOf(PropTypes.shape({
		id: PropTypes.string,
		quantity: PropTypes.number,
		secretCode: PropTypes.string,
		name: PropTypes.string,
	})),
	residents: PropTypes.arrayOf(residentShape),
	comment: PropTypes.string,
	status: PropTypes.status,
	rating: PropTypes.shape({
		id: PropTypes.number,
		username: PropTypes.string,
		formattedDate: PropTypes.string,
		rating: PropTypes.string,
		comment: PropTypes.string,
		listingId: PropTypes.number,
	}),
	character: PropTypes.shape({
		id: PropTypes.number,
		name: PropTypes.string,
		town: PropTypes.shape({
			id: PropTypes.number,
			name: PropTypes.string,
		}),
	}),
	friendCode: PropTypes.string,
	dodoCode: PropTypes.string,
	completed: PropTypes.bool,
	failed: PropTypes.bool,
	bioLocation: PropTypes.string,
	address: PropTypes.string,
});