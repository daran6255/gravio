import type { ReactNode } from 'react';

export type DialogSeverity = 'info' | 'success' | 'warning' | 'error' | 'primary';

export interface BaseDialogProps {
	open: boolean;
	onClose: () => void;
	title: string;
	subtitle?: string;
	children: ReactNode;
	actions?: ReactNode;
	maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
	fullWidth?: boolean;
	loading?: boolean;
	showCloseButton?: boolean;
}

export interface ConfirmationDialogProps extends Omit<BaseDialogProps, 'children' | 'actions'> {
	message: string;
	confirmLabel?: string;
	cancelLabel?: string;
	onConfirm: () => void | Promise<void>;
	severity?: DialogSeverity;
	icon?: ReactNode;
	children?: ReactNode;
}

export interface ImportResult {
	total_rows: number;
	created: number;
	skipped: number;
	errors: Array<{
		row: number;
		error: string;
	}>;
}

export interface ImportDialogProps extends Omit<BaseDialogProps, 'children' | 'actions' | 'title'> {
	onImport: (file: File) => void | Promise<ImportResult | void>;
	acceptedFiles?: string;
	templateUrl?: string;
	onDownloadTemplate?: () => void | Promise<void>;
	title?: string;
	result?: ImportResult | null;
	onResetResult?: () => void;
}

export interface ExportDialogProps extends Omit<BaseDialogProps, 'children' | 'actions' | 'title'> {
	onExport: (format: 'excel' | 'csv') => void | Promise<void>;
	title?: string;
	recordCount?: number;
}

/** A self-contained "Add X" button that opens a BaseDialog on click. The dialog
 * content is provided as a render-prop so it can close itself (e.g. after a
 * successful submit) via the `close` helper, without the parent needing to
 * manage the open/closed state. */
export interface ButtonDialogProps extends Omit<BaseDialogProps, 'open' | 'onClose' | 'children' | 'actions'> {
	buttonLabel: string;
	buttonIcon?: ReactNode;
	buttonVariant?: 'contained' | 'outlined' | 'text';
	children: (helpers: { close: () => void }) => ReactNode;
}
