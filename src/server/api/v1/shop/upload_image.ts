import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import * as crypto from 'crypto';

import { UserError } from '@errors';
import * as APITypes from '@apiTypes';
import { dateUtils, constants } from '@utils';
import { APIThisType, UserType, ShopType } from '@types';

/*
 * Get presigned url to upload to S3.
 */
async function upload_image(this: APIThisType, { imageExtension, shopId }: uploadImageProps): Promise<{ s3PresignedUrl: string, fileName: string }>
{
	const user: UserType = await this.query('v1/user', { id: this.userId });

	if (dateUtils.isNewMember(user.signupDate))
	{
		throw new UserError('permission');
	}

	const shop: ShopType = await this.query('v1/shop', { id: shopId });

	if (!shop)
	{
		throw new UserError('no-such-shop');
	}

	if (!shop.owners.some(o => o.id === this.userId))
	{
		throw new UserError('permission');
	}

	const fileName = `${crypto.randomUUID()}.${imageExtension}`;

	const s3Client = new S3Client({
		region: process.env.AWS_BUCKET_REGION as string,
		endpoint: process.env.AWS_ENDPOINT_URL_S3 as string,
		credentials: {
			accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
			secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
		},
	});

	const command = new PutObjectCommand({
		Bucket: process.env.AWS_BUCKET_NAME,
		Key: `${constants.SHOP_FILE_DIR2}${shop.id}/${fileName}`,
		ContentType: 'image/png',
	});

	return {
		s3PresignedUrl: await getSignedUrl(s3Client, command, {
			expiresIn: 30,
		}),
		fileName: fileName,
	};
}

upload_image.permissions = [
	'modify-shops',
	'userId',
];

upload_image.apiTypes = {
	imageExtension: {
		type: APITypes.string,
		required: true,
	},
	shopId: {
		type: APITypes.number,
		required: true,
	},
};

type uploadImageProps = {
	imageExtension: string
	shopId: number
};

export default upload_image;
