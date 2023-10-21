import React from 'react';

import { dateUtils } from '@utils';

export const PermissionsContext = React.createContext([]);
export const TimeContext = React.createContext(dateUtils.getCurrentDateTimezone());
export const UserContext = React.createContext(null);
export const JackpotContext = React.createContext('0');
export const TreasureContext = React.createContext({});