import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/hooks/useAuth';
import { useUserStats } from '../../hooks/useUserStats';
import { QueryStatus } from '../common/QueryStatus';
import { getUserConnectionsPath, paths } from '../../routes/paths';

export const UserStats = ({ userId }: { userId: string }) => {
    const { authState } = useAuth();
    const counts = useUserStats(userId);
    if (counts.loading || counts.error) return <QueryStatus loading={counts.loading} error={counts.error} />;
    const stats = [
        { label: 'Seguidos', count: counts.following, to: userId === authState.user?.uid ? paths.following : getUserConnectionsPath(userId, 'following') },
        { label: 'Seguidores', count: counts.followers, to: userId === authState.user?.uid ? paths.followers : getUserConnectionsPath(userId, 'followers') },
    ];

    return (
        <div className="user-stats d-flex flex-wrap gap-3 mt-3" aria-label="Estadísticas del usuario">
            {stats.map(({ label, count, to }) => {
                const content = <><strong>{count}</strong> <span className="text-body-secondary">{label}</span></>;
                return <Link className="text-body text-decoration-none" key={label} to={to}>{content}</Link>;
            })}
        </div>
    );
};
