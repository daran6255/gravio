import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface UiState {
	sidebarOpen: boolean;
	chatDrawerOpen: boolean;
}

const initialState: UiState = {
	sidebarOpen: true,
	chatDrawerOpen: false,
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
		toggleChatDrawer: (state) => {
			state.chatDrawerOpen = !state.chatDrawerOpen;
		},
		setChatDrawerOpen: (state, action: PayloadAction<boolean>) => {
			state.chatDrawerOpen = action.payload;
		},
	},
});

export const { toggleSidebar, setSidebarOpen, toggleChatDrawer, setChatDrawerOpen } = uiSlice.actions;
export default uiSlice.reducer;
