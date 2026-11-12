
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/hooks/useAuth';
import { paths } from '../../routes/paths';
import { Avatar } from '../../components/common/Avatar';

export const NavBar = () => {
    const { authState, logout } = useAuth();
    const navigate = useNavigate();
    const user = authState.user;

    const onLogout = () => {
        logout();
        navigate(paths.login, { replace: true });
    };

    return (
        <header className="navbar bg-body border-bottom py-3">
            <div className="container-fluid desktop-container flex-nowrap gap-3">
                <Link className="navbar-brand d-flex align-items-center gap-2 fw-bold m-0" to={paths.home} aria-label="Clon Y · Inicio">
                    <span>Clon Y</span>
                </Link>
                {user && (
                    <div className="d-flex align-items-center gap-3 min-w-0">
                        <div className="d-flex align-items-center gap-2 min-w-0">
                            <Avatar user={user} />
                            <span className="small text-break">
                                <strong className="d-block">{user.fullName}</strong>
                                <span className="text-body-secondary">@{user.username}</span>
                            </span>
                        </div>
                        <button className="btn btn-outline-light btn-sm" onClick={onLogout}>
                            Cerrar sesión
                        </button>
                    </div>
                )}
            </div>
        </header>
    );
};
