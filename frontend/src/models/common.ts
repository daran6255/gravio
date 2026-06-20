export interface ApiResponse<T> {
	data: T;
	message?: string;
	success: boolean;
}

export interface PaginationParams {
	page: number;
	limit: number;
}

/** Matches backend's PaginatedResponse[T] envelope exactly (page/page_size, not skip/limit). */
export interface PaginatedResponse<T> {
	items: T[];
	total: number;
	page: number;
	page_size: number;
}
