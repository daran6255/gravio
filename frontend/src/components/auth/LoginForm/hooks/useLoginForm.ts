import { useState } from 'react';

export const useLoginForm = (onLogin: (identifier: string, password: string) => void) => {
	const [identifier, setIdentifier] = useState('');
	const [password, setPassword] = useState('');
	const [showPassword, setShowPassword] = useState(false);
	const [rememberDevice, setRememberDevice] = useState(false);

	const handleTogglePasswordVisibility = () => {
		setShowPassword((prev) => !prev);
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		onLogin(identifier, password);
	};

	return {
		identifier,
		setIdentifier,
		password,
		setPassword,
		showPassword,
		rememberDevice,
		setRememberDevice,
		handleTogglePasswordVisibility,
		handleSubmit,
	};
};
