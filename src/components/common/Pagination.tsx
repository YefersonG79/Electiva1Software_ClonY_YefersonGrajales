import { PAGE_SIZE } from '../../utils/pagination';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    onPageChange: (page: number) => void;
}

export const Pagination = ({ currentPage, totalPages, totalItems, onPageChange }: PaginationProps) => {
    if (!totalItems) return null;
    const first = (currentPage - 1) * PAGE_SIZE + 1;
    const last = Math.min(currentPage * PAGE_SIZE, totalItems);

    return (
        <nav className="d-flex flex-column align-items-center gap-2 p-3 border-top" aria-label="Paginación">
            <p className="text-body-secondary small mb-0">{first}–{last} de {totalItems}</p>
            <ul className="pagination pagination-sm mb-0">
                <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                    <button className="page-link" type="button" disabled={currentPage === 1}
                        onClick={() => onPageChange(currentPage - 1)}>Anterior</button>
                </li>
                <li className="page-item active">
                    <span className="page-link" aria-current="page" aria-label={`Página ${currentPage} de ${totalPages}`}>
                        {currentPage} / {totalPages}
                    </span>
                </li>
                <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                    <button className="page-link" type="button" disabled={currentPage === totalPages}
                        onClick={() => onPageChange(currentPage + 1)}>Siguiente</button>
                </li>
            </ul>
        </nav>
    );
};
