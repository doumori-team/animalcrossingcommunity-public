import React from 'react';

import { dateUtils } from '@utils';
import { UserType, TreasureType } from '@types';

export const PermissionsContext = React.createContext<string[]>([]);
export const TimeContext = React.createContext<Date>(dateUtils.getCurrentDateTimezone());
export const UserContext = React.createContext<UserType|null>(null);
export const JackpotContext = React.createContext<string>('0');
export const TreasureContext = React.createContext<TreasureType|null>(null);