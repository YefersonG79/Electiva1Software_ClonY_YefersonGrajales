import { useSearchParams } from 'react-router-dom';
import { paginate } from '../utils/pagination';

export const usePagination = <T,>(items: T[]) => {
    const [searchParams, setSearchParams] = useSearchParams();
    const result = paginate(items, Number(searchParams.get('page') ?? 1));
    const onPageChange = (page: number) => {
        setSearchParams({ page: String(page) });
    };

    return { ...result, onPageChange };
};
