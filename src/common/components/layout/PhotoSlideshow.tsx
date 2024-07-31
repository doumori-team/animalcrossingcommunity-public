import React from 'react';
import { Lightbox, useLightboxState } from 'yet-another-react-lightbox';
import Captions from 'yet-another-react-lightbox/plugins/captions';

import { RequireClientJS } from '@behavior';
import { constants } from '@utils';
import ReportProblem from '@/components/layout/ReportProblem.tsx';
import { FileType, FileInProcessType } from '@types';

const PhotoSlideshow = ({
	userId,
	files,
	reportType,
	fileIndex,
	setFileIndex
}: PhotoSlideshowProps) =>
{
	const slides = files?.map(file => {
		return {
			src: `${constants.USER_FILE_DIR}${userId}/${file.fileId}`,
			alt: file.caption,
			title: file.caption,
			width: Number(file.width || 0),
			height: Number(file.height || 0),
			id: file.id,
			description: file.caption,
		};
	});

	const ReportProblemButton = () : React.ReactNode | null => {
		const {currentIndex} = useLightboxState();

		if (reportType == null)
		{
			return null;
		}

		return (
			<ReportProblem
				type={reportType}
				id={Number(slides[currentIndex].id || 0)}
			/>
		);
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

type PhotoSlideshowProps = {
	userId: number
	files: FileType[] | FileInProcessType[]
	reportType?: string
	fileIndex: number
	setFileIndex: (index: number) => void
};

export default PhotoSlideshow;