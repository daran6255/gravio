import React, { useState } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { DndContext, DragOverlay, type DragEndEvent, type DragStartEvent } from '@dnd-kit/core';
import KanbanColumn from './KanbanColumn';

export interface KanbanColumnDef {
	id: string | number;
	label: string;
	color?: string;
}

export interface KanbanBoardProps<T> {
	columns: KanbanColumnDef[];
	items: T[];
	getItemId: (item: T) => string | number;
	getItemColumnId: (item: T) => string | number;
	renderCard: (item: T) => React.ReactNode;
	renderColumnFooter?: (columnItems: T[]) => React.ReactNode;
	onMoveItem?: (item: T, targetColumn: KanbanColumnDef) => void;
	loading?: boolean;
	emptyMessage?: string;
	columnWidth?: number;
}

export function KanbanBoard<T>({
	columns,
	items,
	getItemId,
	getItemColumnId,
	renderCard,
	renderColumnFooter,
	onMoveItem,
	loading,
	emptyMessage = 'No columns to display.',
	columnWidth,
}: KanbanBoardProps<T>) {
	const [activeItem, setActiveItem] = useState<T | null>(null);

	const handleDragStart = (event: DragStartEvent) => {
		setActiveItem((event.active.data.current?.item as T) ?? null);
	};

	const handleDragEnd = (event: DragEndEvent) => {
		setActiveItem(null);
		const { active, over } = event;
		if (!over) return;

		const item = active.data.current?.item as T | undefined;
		const targetColumn = columns.find((c) => c.id === over.id);
		if (!item || !targetColumn || getItemColumnId(item) === targetColumn.id) return;

		onMoveItem?.(item, targetColumn);
	};

	if (loading) {
		return (
			<Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
				<CircularProgress />
			</Box>
		);
	}

	if (columns.length === 0) {
		return (
			<Box sx={{ textAlign: 'center', py: 8 }}>
				<Typography color="text.secondary">{emptyMessage}</Typography>
			</Box>
		);
	}

	const itemsByColumn = (columnId: string | number) => items.filter((item) => getItemColumnId(item) === columnId);

	return (
		<DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
			<Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 2 }}>
				{columns.map((column) => {
					const columnItems = itemsByColumn(column.id);
					return (
						<KanbanColumn
							key={column.id}
							id={column.id}
							label={column.label}
							color={column.color}
							count={columnItems.length}
							footer={renderColumnFooter?.(columnItems)}
							width={columnWidth}
						>
							{columnItems.map((item) => (
								<React.Fragment key={getItemId(item)}>{renderCard(item)}</React.Fragment>
							))}
						</KanbanColumn>
					);
				})}
			</Box>

			<DragOverlay>{activeItem ? renderCard(activeItem) : null}</DragOverlay>
		</DndContext>
	);
}

export default KanbanBoard;
