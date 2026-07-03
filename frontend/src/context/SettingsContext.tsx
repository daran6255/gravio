import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

interface SettingsContextType {
	/** Set of dirty field keys, e.g. 'profile.fullName', 'preferences.timezone' */
	dirtyFields: Set<string>;
	/** Mark a field as dirty */
	markDirty: (key: string) => void;
	/** Mark a field as clean */
	markClean: (key: string) => void;
	/** Clear all dirty state */
	clearAll: () => void;
	/** Number of unsaved changes */
	unsavedCount: number;
	/** Whether any changes exist */
	hasChanges: boolean;
	/** Register a save handler for a specific tab */
	registerSaveHandler: (tabKey: string, handler: () => Promise<void>) => void;
	/** Register a discard handler for a specific tab */
	registerDiscardHandler: (tabKey: string, handler: () => void) => void;
	/** Trigger all registered save handlers */
	handleSave: () => Promise<void>;
	/** Trigger all registered discard handlers */
	handleDiscard: () => void;
	/** Whether a save is in progress */
	saving: boolean;
}

const SettingsContext = createContext<SettingsContextType>({
	dirtyFields: new Set(),
	markDirty: () => {},
	markClean: () => {},
	clearAll: () => {},
	unsavedCount: 0,
	hasChanges: false,
	registerSaveHandler: () => {},
	registerDiscardHandler: () => {},
	handleSave: async () => {},
	handleDiscard: () => {},
	saving: false,
});

// eslint-disable-next-line react-refresh/only-export-components
export const useSettingsContext = () => useContext(SettingsContext);

interface SettingsProviderProps {
	children: React.ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
	const [dirtyFields, setDirtyFields] = useState<Set<string>>(new Set());
	const [saving, setSaving] = useState(false);
	const [saveHandlers] = useState<Map<string, () => Promise<void>>>(new Map());
	const [discardHandlers] = useState<Map<string, () => void>>(new Map());

	const markDirty = useCallback((key: string) => {
		setDirtyFields((prev) => {
			const next = new Set(prev);
			next.add(key);
			return next;
		});
	}, []);

	const markClean = useCallback((key: string) => {
		setDirtyFields((prev) => {
			const next = new Set(prev);
			next.delete(key);
			return next;
		});
	}, []);

	const clearAll = useCallback(() => {
		setDirtyFields(new Set());
	}, []);

	const registerSaveHandler = useCallback(
		(tabKey: string, handler: () => Promise<void>) => {
			saveHandlers.set(tabKey, handler);
		},
		[saveHandlers]
	);

	const registerDiscardHandler = useCallback(
		(tabKey: string, handler: () => void) => {
			discardHandlers.set(tabKey, handler);
		},
		[discardHandlers]
	);

	const handleSave = useCallback(async () => {
		setSaving(true);
		try {
			const promises = Array.from(saveHandlers.values()).map((handler) => handler());
			await Promise.all(promises);
			clearAll();
		} finally {
			setSaving(false);
		}
	}, [saveHandlers, clearAll]);

	const handleDiscard = useCallback(() => {
		discardHandlers.forEach((handler) => handler());
		clearAll();
	}, [discardHandlers, clearAll]);

	const value = useMemo(
		() => ({
			dirtyFields,
			markDirty,
			markClean,
			clearAll,
			unsavedCount: dirtyFields.size,
			hasChanges: dirtyFields.size > 0,
			registerSaveHandler,
			registerDiscardHandler,
			handleSave,
			handleDiscard,
			saving,
		}),
		[dirtyFields, markDirty, markClean, clearAll, registerSaveHandler, registerDiscardHandler, handleSave, handleDiscard, saving]
	);

	return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};

export default SettingsContext;
