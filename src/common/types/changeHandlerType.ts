import { ChangeEvent, MouseEvent } from 'react';

type ElementSelectType = ChangeEvent<HTMLSelectElement>;

type ChangeHandlerSelectType = (e: ElementSelectType) => any;

type ElementInputType = ChangeEvent<HTMLInputElement>;

type ChangeHandlerInputType = (e: ElementInputType) => any;

type ElementTextAreaType = ChangeEvent<HTMLTextAreaElement>;

type ChangeHandlerTextAreaType = (e: ChangeEvent<HTMLTextAreaElement>) => any;

type ChangeHandleValueType = (value: any) => any;

type ElementClickType = MouseEvent<HTMLInputElement>;

type ClickHandlerType = (e: ElementClickType) => any;

type ElementClickButtonType = MouseEvent<HTMLButtonElement>;

type ClickHandlerButtonType = (e: ElementClickButtonType) => any;

export type { ChangeHandlerSelectType, ElementSelectType, ChangeHandlerInputType, ElementInputType, ChangeHandleValueType, ClickHandlerType, ElementClickType, ChangeHandlerTextAreaType, ElementTextAreaType, ElementClickButtonType, ClickHandlerButtonType };
