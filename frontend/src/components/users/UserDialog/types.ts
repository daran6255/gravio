import type { User, UserCreate } from '../../../models/user';

export interface UserDialogProps {
	open: boolean;
	mode: 'add' | 'edit' | 'view';
	user?: User | null;
	onClose: () => void;
	onSuccess?: (message: string) => void;
}

export interface UserFormData extends UserCreate {
	confirmPassword?: string;
}

export interface StepProps {
	formData: UserFormData;
	handleChange: (field: string, value: string | boolean) => void;
	loading: boolean;
	mode: 'add' | 'edit' | 'view';
	roles?: string[];
	user?: User | null;
}
