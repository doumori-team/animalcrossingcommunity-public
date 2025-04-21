// based on v1/notification, v1/global_notification
type NotificationType = {
	id: number
	description: string
	url: string
	formattedCreated: string
	formattedNotified: string
	anchor?: string
	type: string
	icon: string
	count?: number
};

export type { NotificationType };
