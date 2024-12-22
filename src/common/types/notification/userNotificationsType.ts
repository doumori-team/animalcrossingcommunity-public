import { NotificationType } from './notificationType.ts';

type UserNotificationsType = {
	userNotifications: NotificationType[]
	globalNotifications: NotificationType[]
	page: number
	pageSize: number
	userTotalCount: number
	globalTotalCount: number
};

export type { UserNotificationsType };
