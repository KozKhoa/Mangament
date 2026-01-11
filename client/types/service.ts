type Pagination = { page: number; pageSize: number; totalItems: number; totalPages: number };
type ServiceResult<T> = { success: true; data: T; pagination?: Pagination } | { error?: unknown };

export default ServiceResult;
