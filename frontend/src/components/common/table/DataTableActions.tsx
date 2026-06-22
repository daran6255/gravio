import React, { memo } from 'react';
import { useTheme, type Theme } from '@mui/material';
import ContextMenu, { type ActionMenuItem } from '../action-menu/ContextMenu';

export interface TableMenuAction<T> {
	label: string;
	icon?: React.ReactNode;
	onClick: (item: T) => void;
	color?: string;
	divider?: boolean;
	disabled?: boolean;
	hidden?: boolean;
}

interface DataTableActionsProps<T> {
	item: T;
	actions: TableMenuAction<T>[];
	tooltipTitle?: string;
}

/** Resolves a theme color path like 'error.main' to its actual CSS color value. */
const resolveThemeColor = (theme: Theme, path?: string): string | undefined => {
	if (!path) return undefined;
	const value = path.split('.').reduce<any>((acc, key) => (acc ? acc[key] : undefined), theme.palette as any);
	return typeof value === 'string' ? value : undefined;
};

const DataTableActions = <T,>({
	item,
	actions,
	tooltipTitle = 'Actions'
}: DataTableActionsProps<T>) => {
	const theme = useTheme();
	const visibleActions = actions.filter(action => !action.hidden);

	if (visibleActions.length === 0) return null;

	const menuItems: ActionMenuItem[] = visibleActions.map((action) => ({
		label: action.label,
		icon: action.icon ?? null,
		onClick: () => action.onClick(item),
		color: resolveThemeColor(theme, action.color),
		divider: action.divider,
		disabled: action.disabled,
	}));

	return <ContextMenu actions={menuItems} triggerTooltip={tooltipTitle} />;
};

export default memo(DataTableActions) as typeof DataTableActions;
