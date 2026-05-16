export interface ApiResponse<T> {
	data: T;
	message?: string;
	success: boolean;
}

export interface PaginationParams {
	page: number;
	limit: number;
}
