import PropTypes from 'prop-types';

import userShape from './user/user-shape.js';
import fileShape from './file-shape.js';

export default {
	id: PropTypes.number,
	type: PropTypes.string,
	parentId: PropTypes.number,
	revisionId: PropTypes.number,
	title: PropTypes.string,
	created: PropTypes.any,
	locked: PropTypes.bool,
	threadType: PropTypes.string,
	edits: PropTypes.number,
	followed: PropTypes.bool,
	numFollowed: PropTypes.number,
	board: PropTypes.string,
	user: userShape,
	content: PropTypes.shape({
		text: PropTypes.string,
		format: PropTypes.oneOf(['plaintext', 'markdown', 'bbcode']),
	}),
	lastReply: PropTypes.string,
	users: PropTypes.arrayOf(PropTypes.shape({
		id: PropTypes.number,
		username: PropTypes.string,
		granted: PropTypes.bool,
	})),
	latestPage: PropTypes.number,
	latestPost: PropTypes.number,
	replyCount: PropTypes.number,
	unread: PropTypes.bool,
	unreadTotal: PropTypes.number,
	markupStyle: PropTypes.oneOf(['plaintext', 'markdown', 'bbcode']),
	conciseMode: PropTypes.number,
	files: fileShape,
	showImages: PropTypes.bool,
};