export const PAGE_SIZE = 10;

export const paginate = <T,>(items: T[], requestedPage: number) => {
    const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
    const finitePage = Number.isFinite(requestedPage) ? Math.floor(requestedPage) : 1;
    const currentPage = Math.min(totalPages, Math.max(1, finitePage));
    const startIndex = (currentPage - 1) * PAGE_SIZE;

    return {
        items: items.slice(startIndex, startIndex + PAGE_SIZE),
        currentPage,
        totalPages,
        totalItems: items.length,
        startIndex,
    };
};
