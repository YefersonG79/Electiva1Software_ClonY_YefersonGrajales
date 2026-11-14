
import { Link, Outlet } from 'react-router-dom';
import { paths } from '../../routes/paths';

export const AuthLayout = () => (
    <main className="container-fluid desktop-container min-vh-100 d-flex flex-column justify-content-center align-items-center py-4" id="main-content">
        <Link className="d-flex align-items-center gap-2 mb-4 text-decoration-none text-body fs-4 fw-bold" to={paths.home} aria-label="Clon Y · Inicio">
            Clon Y
        </Link>
        <section className="card auth-card" aria-label="Acceso a la comunidad">
            <div className="card-body p-4"><Outlet /></div>
        </section>
    </main>
);
