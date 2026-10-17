/** Page sizes offered by every table (DataGrid Community allows at most 100 rows per page). */
export const PAGE_SIZES = [25, 50, 100] as const;
export const DEFAULT_PAGE_SIZE = 50;

type Param = string | string[] | undefined;

const first = (value: Param) => (Array.isArray(value) ? value[0] : value);

/** Reads `?page=&size=` from a URL; anything unusable falls back to page 0 / size 50. */
export function parsePaging(params: { page?: Param; size?: Param }): { page: number; size: number } {
  const page = Number(first(params.page));
  const size = Number(first(params.size));
  return {
    page: Number.isInteger(page) && page >= 0 ? page : 0,
    size: (PAGE_SIZES as readonly number[]).includes(size) ? size : DEFAULT_PAGE_SIZE,
  };
}

export function pagingHref(pathname: string, page: number, size: number): string {
  return `${pathname}?page=${page}&size=${size}`;
}
