import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/hooks/useAuth';
import { useMockData } from '../../data/useMockData';
import { paths } from '../../routes/paths';

export const UserStats = ({ userId }: { userId: string }) => {
    const { authState } = useAuth();
    const { relationships } = useMockData();
    const stats = [
        { label: 'Seguidos', count: relationships.filter((item) => item.followerId === userId).length, to: paths.following },
        { label: 'Seguidores', count: relationships.filter((item) => item.followingId === userId).length, to: paths.followers },
    ];

    return (
        <div className="user-stats d-flex flex-wrap gap-3 mt-3" aria-label="Estadísticas del usuario">
            {stats.map(({ label, count, to }) => {
                const content = <><strong>{count}</strong> <span className="text-body-secondary">{label}</span></>;
                return userId === authState.user?.uid
                    ? <Link className="text-body text-decoration-none" key={label} to={to}>{content}</Link>
                    : <span key={label}>{content}</span>;
            })}
        </div>
    );
};
