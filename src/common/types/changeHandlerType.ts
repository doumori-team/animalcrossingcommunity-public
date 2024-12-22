import React from 'react';

type ElementSelectType = React.ChangeEvent<HTMLSelectElement>;

type ChangeHandlerSelectType = (e: ElementSelectType) => any;

type ElementInputType = React.ChangeEvent<HTMLInputElement>;

type ChangeHandlerInputType = (e: ElementInputType) => any;

type ElementTextAreaType = React.ChangeEvent<HTMLTextAreaElement>;

type ChangeHandlerTextAreaType = (e: React.ChangeEvent<HTMLTextAreaElement>) => any;

type ChangeHandleValueType = (value: any) => any;

type ElementClickType = React.MouseEvent<HTMLInputElement>;

type ClickHandlerType = (e: ElementClickType) => any;

type ElementClickButtonType = React.MouseEvent<HTMLButtonElement>;

type ClickHandlerButtonType = (e: ElementClickButtonType) => any;

export type { ChangeHandlerSelectType, ElementSelectType, ChangeHandlerInputType, ElementInputType, ChangeHandleValueType, ClickHandlerType, ElementClickType, ChangeHandlerTextAreaType, ElementTextAreaType, ElementClickButtonType, ClickHandlerButtonType };
