import React, { useState, useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { fetchHolidays, createHoliday, deleteHoliday } from '../../../../store/slices/timesheetSlice';
import type { OrgHoliday } from '../../../../models/timesheet';

export const useHolidayCalendar = () => {
	const dispatch = useAppDispatch();
	const currentUser = useAppSelector((state) => state.auth.user);
	const { holidays, holidaysLoading } = useAppSelector((state) => state.timesheets);

	const [name, setName] = useState('');
	const [holidayDate, setHolidayDate] = useState('');
	const [type, setType] = useState('public');
	const [countryCode, setCountryCode] = useState('');
	const [error, setError] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);

	// Import state
	const [importDialogOpen, setImportDialogOpen] = useState(false);
	const [dragOver, setDragOver] = useState(false);
	const [importPreview, setImportPreview] = useState<{ holiday_date: string; name: string; type: string; country_code?: string }[]>([]);
	const [importError, setImportError] = useState<string | null>(null);
	const [importLoading, setImportLoading] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	// Delete confirmation state
	const [deleteTarget, setDeleteTarget] = useState<OrgHoliday | null>(null);
	const [deleteLoading, setDeleteLoading] = useState(false);

	// Pagination state for the holidays list
	const [page, setPage] = useState(0);
	const [rowsPerPage, setRowsPerPage] = useState(10);

	useEffect(() => {
		dispatch(fetchHolidays());
	}, [dispatch]);

	// Clamp back to the last valid page if the list shrinks (e.g. after a delete)
	// and the current page runs off the end.
	useEffect(() => {
		const maxPage = Math.max(0, Math.ceil(holidays.length / rowsPerPage) - 1);
		if (page > maxPage) setPage(maxPage);
	}, [holidays.length, rowsPerPage, page]);

	const paginatedHolidays = holidays.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

	const handleCreate = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);

		if (!name.trim() || !holidayDate) {
			setError('Holiday Name and Date are required');
			return;
		}

		setSubmitting(true);
		try {
			await dispatch(
				createHoliday({
					name,
					holiday_date: holidayDate,
					type,
					country_code: countryCode || undefined
				})
			).unwrap();
			setName('');
			setHolidayDate('');
			setCountryCode('');
		} catch (err) {
			setError(err instanceof Error ? err.message : String(err));
		} finally {
			setSubmitting(false);
		}
	};

	const handleConfirmDelete = async () => {
		if (!deleteTarget) return;
		setError(null);
		setDeleteLoading(true);
		try {
			await dispatch(deleteHoliday(deleteTarget.id)).unwrap();
			setDeleteTarget(null);
		} catch (err) {
			setError(err instanceof Error ? err.message : String(err));
		} finally {
			setDeleteLoading(false);
		}
	};

	const handleCloseImport = () => {
		setImportDialogOpen(false);
		setImportPreview([]);
		setImportError(null);
		setDragOver(false);
	};

	const parseFile = (file: File) => {
		setImportError(null);
		const reader = new FileReader();

		reader.onload = (e) => {
			const text = e.target?.result as string;
			if (!text) {
				setImportError('Failed to read file content');
				return;
			}

			try {
				if (file.name.endsWith('.json')) {
					const parsed = JSON.parse(text);
					if (!Array.isArray(parsed)) {
						throw new Error('JSON file must contain an array of holiday objects');
					}
					
					const validated = parsed.map((item: unknown, index: number) => {
						const typedItem = item as Record<string, unknown>;
						if (!typedItem.holiday_date || !typedItem.name) {
							throw new Error(`Item at index ${index} is missing required 'holiday_date' or 'name'`);
						}
						return {
							holiday_date: String(typedItem.holiday_date),
							name: String(typedItem.name),
							type: String(typedItem.type || 'public'),
							country_code: typedItem.country_code ? String(typedItem.country_code) : undefined
						};
					});
					setImportPreview(validated);
				} else if (file.name.endsWith('.csv')) {
					const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
					if (lines.length <= 1) {
						throw new Error('CSV file is empty or missing headers');
					}

					const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
					const dateIdx = headers.indexOf('holiday_date');
					const nameIdx = headers.indexOf('name');
					const typeIdx = headers.indexOf('type');
					const countryIdx = headers.indexOf('country_code');

					if (dateIdx === -1 || nameIdx === -1) {
						throw new Error('CSV must contain "holiday_date" and "name" columns');
					}

					const validated = [];
					for (let i = 1; i < lines.length; i++) {
						const row = lines[i].split(',').map(cell => cell.trim());
						if (row.length < 2) continue; // Skip incomplete lines

						const dateVal = row[dateIdx];
						const nameVal = row[nameIdx];
						
						if (!dateVal || !nameVal) {
							throw new Error(`Line ${i + 1} is missing required date or name value`);
						}

						validated.push({
							holiday_date: dateVal,
							name: nameVal,
							type: typeIdx !== -1 && row[typeIdx] ? row[typeIdx] : 'public',
							country_code: countryIdx !== -1 && row[countryIdx] ? row[countryIdx] : undefined
						});
					}
					setImportPreview(validated);
				} else {
					setImportError('Unsupported file type. Please upload a .csv or .json file');
				}
			} catch (err) {
				setImportError(err instanceof Error ? err.message : 'Error parsing file content');
				setImportPreview([]);
			}
		};

		reader.readAsText(file);
	};

	const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = e.target.files;
		if (files && files.length > 0) {
			parseFile(files[0]);
		}
	};

	const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		setDragOver(false);
		const files = e.dataTransfer.files;
		if (files && files.length > 0) {
			parseFile(files[0]);
		}
	};

	const handleConfirmImport = async () => {
		setImportLoading(true);
		setImportError(null);

		let successCount = 0;

		try {
			await Promise.all(
				importPreview.map(async (h) => {
					try {
						// Check if holiday already exists on this date to prevent duplicates
						const isDuplicate = holidays.some(
							(existing) => existing.holiday_date === h.holiday_date
						);
						if (isDuplicate) return;

						await dispatch(
							createHoliday({
								name: h.name,
								holiday_date: h.holiday_date,
								type: h.type,
								country_code: h.country_code
							})
						).unwrap();
						successCount++;
					} catch {
						// Ignore and continue
					}
				})
			);

			if (successCount > 0) {
				dispatch(fetchHolidays()); // reload
				handleCloseImport();
			} else {
				setImportError('No new holidays were imported (they might already exist).');
			}
		} catch {
			setImportError('An unexpected error occurred during import');
		} finally {
			setImportLoading(false);
		}
	};

	return {
		name, setName,
		holidayDate, setHolidayDate,
		type, setType,
		countryCode, setCountryCode,
		error, setError,
		submitting,
		importDialogOpen, setImportDialogOpen,
		dragOver, setDragOver,
		importPreview,
		importError, setImportError,
		importLoading,
		fileInputRef,
		deleteTarget, setDeleteTarget,
		deleteLoading,
		page, setPage,
		rowsPerPage, setRowsPerPage,
		holidays,
		holidaysLoading,
		currentUser,
		paginatedHolidays,
		handleCreate,
		handleConfirmDelete,
		handleCloseImport,
		handleFileSelect,
		handleFileDrop,
		handleConfirmImport
	};
};
