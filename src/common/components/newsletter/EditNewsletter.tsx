import { Form, Text } from '@form';
import { NewsletterType } from '@types';
import ImageUpload from '@/components/layout/ImageUpload.tsx';
import { constants } from '@utils';

const EditNewsletter = ({
	newsletter,
}: EditNewsletterProps) =>
{
	return (
		<section className='EditNewsletter'>
			<Form action='v1/newsletter/save' callback='/newsletter/:id' showButton>
				<input type='hidden' name='id' value={newsletter ? newsletter.id : 0} />

				<Form.Group>
					<Text
						name='issue'
						type='number'
						value={newsletter ? newsletter.issue : 1}
						required
						label='Issue'
						className='text-full'
					/>
				</Form.Group>

				<Form.Group>
					<Text
						name='volume'
						type='number'
						value={newsletter ? newsletter.volume : 1}
						required
						label='Volume'
						className='text-full'
					/>
				</Form.Group>

				<Form.Group>
					<Text
						type='date'
						name='issueDate'
						label='Issue Date'
						value={newsletter ? newsletter.issueDate : ''}
						min='2002-10-28'
					/>
				</Form.Group>

				{newsletter &&
					<>
						<ImageUpload
							directory={`${constants.NEWSLETTER_IMAGE_FILE_DIR2}${newsletter.issue}`}
							api='v1/newsletter/upload_image'
							hidden
						/>
						{newsletter && newsletter.header &&
							<>
								You have a header uploaded! Upload it again to keep it, or leave it blank to remove it.
							</>
						}
					</>
				}
			</Form>
		</section>
	);
};

type EditNewsletterProps = {
	newsletter?: NewsletterType
};

export default EditNewsletter;
