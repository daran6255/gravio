/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useMemo } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { getThemeByMode } from './theme';

interface ColorModeContextType {
	mode: 'light' | 'dark';
	toggleColorMode: () => void;
}

const ColorModeContext = createContext<ColorModeContextType>({
	mode: 'dark',
	toggleColorMode: () => {},
});

export const useColorMode = () => useContext(ColorModeContext);

interface ColorModeProviderProps {
	children: React.ReactNode;
}

export const ColorModeProvider: React.FC<ColorModeProviderProps> = ({ children }) => {
	const [mode, setMode] = useState<'light' | 'dark'>(() => {
		const savedMode = localStorage.getItem('theme_mode');
		return savedMode === 'light' || savedMode === 'dark' ? savedMode : 'dark';
	});

	const toggleColorMode = () => {
		setMode((prevMode) => {
			const nextMode = prevMode === 'light' ? 'dark' : 'light';
			localStorage.setItem('theme_mode', nextMode);
			return nextMode;
		});
	};

	const theme = useMemo(() => getThemeByMode(mode), [mode]);

	return (
		<ColorModeContext.Provider value={{ mode, toggleColorMode }}>
			<ThemeProvider theme={theme}>
				{children}
			</ThemeProvider>
		</ColorModeContext.Provider>
	);
};
