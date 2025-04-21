import { createContext } from 'react';

import { UserType } from '@types';

export const PermissionsContext = createContext<string[]>([]);
export const TimeContext = createContext<Date | null>(null);
export const UserContext = createContext<UserType | null>(null);
export const JackpotContext = createContext<string>('0');
