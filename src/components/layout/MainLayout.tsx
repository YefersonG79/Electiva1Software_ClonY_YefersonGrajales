
import { Navigate, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../auth/hooks/useAuth';
import { getUserTweetsPath, paths } from '../../routes/paths';
import { NavBar } from '../../ui/components/NavBar';

export const MainLayout = () => {
    const { authState } = useAuth();
    const location = useLocation();

    if (!authState.user) {
        return <Navigate to={paths.login} replace state={{ from: location.pathname + location.search }} />;
    }

    const navigation = [
        { to: paths.home, label: 'Inicio' },
        { to: paths.feed, label: 'Feed' },
        { to: paths.following, label: 'Seguidos' },
        { to: paths.followers, label: 'Seguidores' },
        { to: getUserTweetsPath(authState.user.username), label: 'Mi perfil' },
    ];

    return (
        <>
            <a className="visually-hidden-focusable position-absolute top-0 start-0 bg-body p-3 z-3" href="#main-content">Ir al contenido</a>
            <NavBar />
            <div className="container-fluid desktop-container py-4">
                <div className="row g-4">
                    <aside className="col-3">
                        <nav className="nav nav-pills flex-column gap-2" aria-label="Navegación principal">
                            {navigation.map(({ to, label }) => (
                                <NavLink className="nav-link" to={to} key={to} end>{label}</NavLink>
                            ))}
                            <NavLink className="btn btn-primary mt-2" to={paths.publish}>Publicar</NavLink>
                        </nav>
                    </aside>
                    <main className="col-9 min-w-0" id="main-content" tabIndex={-1}>
                        <div className="card"><Outlet /></div>
                    </main>
                </div>
            </div>
        </>
    );
};
