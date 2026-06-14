import { ReactNode } from 'react';
import { Lightbox, useLightboxState } from 'yet-another-react-lightbox';
import Captions from 'yet-another-react-lightbox/plugins/captions';
import 'yet-another-react-lightbox/styles.css';
import 'yet-another-react-lightbox/plugins/captions.css';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';

import { RequireClientJS } from '@behavior';
import { constants, utils } from '@utils';
import { FileType, FileInProcessType } from '@types';
import { Form } from '@form';

const PhotoSlideshow = ({
	userId,
	files,
	reportType,
	fileIndex,
	setFileIndex,
}: PhotoSlideshowProps) =>
{
	const slides = files?.map(file =>
	{
		return {
			src: `${constants.USER_FILE_DIR}${userId}/${file.fileId}`,
			alt: file.caption,
			title: file.caption,
			width: utils.safeNumber(file.width),
			height: utils.safeNumber(file.height),
			id: file.id,
			description: file.caption,
		};
	});

	const ReportProblemButton = (): ReactNode | null =>
	{
		const { currentIndex } = useLightboxState();

		if (!reportType)
		{
			return null;
		}

		const id = utils.safeNumber(slides[currentIndex].id);

		// see ReportProblem.tsx
		return (
			<Form
				action='v1/rule/report'
				showButton={false}
				buttonText='Report a Problem'
				defaultSubmitImage={
					constants.allImages['icons/report.png']
				}
				imageTitle='Report a Problem'
				formId={`report-problem-${id}-${reportType}`}
			>
				<input type='hidden' name='referenceId' value={id} />
				<input type='hidden' name='type' value={reportType} />
			</Form>
		);
	};

	return (
		<RequireClientJS>
			<Lightbox
				index={fileIndex}
				slides={slides}
				open={fileIndex >= 0}
				close={() => setFileIndex(-1)}
				plugins={[Captions, Zoom]}
				toolbar={{
					buttons: [
						<div key='report-problem' className='yarl__button'><ReportProblemButton /></div>,
						'close',
					],
				}}
			/>
		</RequireClientJS>
	);
};

type PhotoSlideshowProps = {
	userId: number
	files: FileType[] | FileInProcessType[]
	reportType?: string
	fileIndex: number
	setFileIndex: (index: number) => void
};

export default PhotoSlideshow;
