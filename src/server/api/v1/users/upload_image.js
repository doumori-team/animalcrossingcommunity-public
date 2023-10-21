import { UserError } from '@errors';
import * as APITypes from '@apiTypes';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as crypto from 'crypto';
import { dateUtils, constants } from '@utils';

/*
 * Get presigned url to upload to S3.
 */
async function upload_image({imageExtension})
{
	if (!this.userId)
	{
		throw new UserError('login-needed');
	}

	const user = await this.query('v1/user_lite', {id: this.userId});

	if (typeof(user) === 'undefined' || user.length === 0)
	{
		throw new UserError('no-such-user');
	}

	if (dateUtils.isNewMember(user.signupDate))
	{
		throw new UserError('permission');
	}

	const fileName = `${crypto.randomUUID()}.${imageExtension}`;

	const s3Client = new S3Client({
		region: process.env.AWS_BUCKET_REGION,
		credentials: {
			accessKeyId: process.env.AWS_ACCESS_KEY,
			secretAccessKey: process.env.AWS_SECRET_KEY
		}
	});

	// AWS Bucket Policy allows: *.png, *.jpg / *.jpeg

	const command = new PutObjectCommand({
		Bucket: process.env.AWS_BUCKET_NAME,
		Key: `${constants.USER_FILE_DIR2}${this.userId}/${fileName}`
	});

	return {
		s3PresignedUrl: await getSignedUrl(s3Client, command, {
			expiresIn: 30,
		}),
		fileName: fileName,
	};
}

upload_image.apiTypes = {
	imageExtension: {
		type: APITypes.string,
		required: true,
	},
}

export default upload_image;