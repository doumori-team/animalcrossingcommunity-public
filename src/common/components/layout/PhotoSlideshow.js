import React from 'react';
import PropTypes from 'prop-types';
import { Lightbox, useLightboxState } from 'yet-another-react-lightbox';
import Captions from 'yet-another-react-lightbox/plugins/captions';

import { RequireClientJS } from '@behavior';
import { constants } from '@utils';
import ReportProblem from './ReportProblem.js';
import { fileShape } from '@propTypes';

const PhotoSlideshow = ({userId, files, reportType, fileIndex, setFileIndex}) =>
{
	const slides = files?.map(file => {
		return {
			src: `${constants.USER_FILE_DIR}${userId}/${file.fileId}`,
			alt: file.caption,
			title: file.caption,
			width: file.width,
			height: file.height,
			id: file.id,
			description: file.caption,
		};
	});

	const ReportProblemButton = () => {
		const {currentIndex} = useLightboxState();

		return <ReportProblem
			type={reportType}
			id={slides[currentIndex].id}
		/>;
	}

	return (
		<RequireClientJS>
			<Lightbox
				index={fileIndex}
				slides={slides}
				open={fileIndex >= 0}
				close={() => setFileIndex(-1)}
				plugins={[Captions]}
				toolbar={reportType ? {
					buttons: [
						<ReportProblemButton key='report-problem' />,
						'close',
					],
				} : {
					buttons: [
					  'close',
					],
				}}
			/>
		</RequireClientJS>
	);
}

PhotoSlideshow.propTypes = {
	userId: PropTypes.number.isRequired,
	files: fileShape.isRequired,
	reportType: PropTypes.string,
	fileIndex: PropTypes.number.isRequired,
	setFileIndex: PropTypes.func.isRequired,
};

export default PhotoSlideshow;