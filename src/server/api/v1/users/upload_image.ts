import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as crypto from 'crypto';

import { UserError } from '@errors';
import * as APITypes from '@apiTypes';
import { dateUtils, constants } from '@utils';
import { APIThisType, UserType } from '@types';

/*
 * Get presigned url to upload to S3.
 */
async function upload_image(this: APIThisType, { imageExtension }: uploadImageProps): Promise<{ s3PresignedUrl: string, fileName: string }>
{
	if (!this.userId)
	{
		throw new UserError('login-needed');
	}

	const user: UserType = await this.query('v1/user', { id: this.userId });

	if (dateUtils.isNewMember(user.signupDate))
	{
		throw new UserError('permission');
	}

	const fileName = `${crypto.randomUUID()}.${imageExtension}`;

	const s3Client = new S3Client({
		region: (process.env as any).AWS_BUCKET_REGION,
		credentials: {
			accessKeyId: (process.env as any).AWS_ACCESS_KEY,
			secretAccessKey: (process.env as any).AWS_SECRET_KEY,
		},
	});

	// AWS Bucket Policy allows: *.png, *.jpg / *.jpeg

	const command = new PutObjectCommand({
		Bucket: process.env.AWS_BUCKET_NAME,
		Key: `${constants.USER_FILE_DIR2}${this.userId}/${fileName}`,
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
};

type uploadImageProps = {
	imageExtension: string
};

export default upload_image;
