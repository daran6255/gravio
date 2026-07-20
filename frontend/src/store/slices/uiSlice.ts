import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface UiState {
	sidebarOpen: boolean;
	ariaChatOpen: boolean;
}

const initialState: UiState = {
	sidebarOpen: true,
	ariaChatOpen: false,
};

const uiSlice = createSlice({
	name: 'ui',
	initialState,
	reducers: {
		toggleSidebar: (state) => {
			state.sidebarOpen = !state.sidebarOpen;
		},
		setSidebarOpen: (state, action: PayloadAction<boolean>) => {
			state.sidebarOpen = action.payload;
		},
		toggleAriaChat: (state) => {
			state.ariaChatOpen = !state.ariaChatOpen;
		},
		setAriaChatOpen: (state, action: PayloadAction<boolean>) => {
			state.ariaChatOpen = action.payload;
		},
	},
});

export const { toggleSidebar, setSidebarOpen, toggleAriaChat, setAriaChatOpen } = uiSlice.actions;
export default uiSlice.reducer;
