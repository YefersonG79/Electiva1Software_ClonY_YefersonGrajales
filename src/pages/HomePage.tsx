import { Link } from 'react-router-dom';
import { useAuth } from '../auth/hooks/useAuth';
import { paths } from '../routes/paths';
import { UserStats } from '../components/users/UserStats';
import { PageHeading } from '../components/common/PageHeading';

export const HomePage = () => {
    const { authState } = useAuth();

    return (
        <>
            <PageHeading title="Inicio" subtitle="Tu comunidad" />
            <section className="card-body p-4">
                <h2 className="h4">Hola, {authState.user?.fullName.split(' ')[0]}</h2>
                <p className="text-body-secondary">Comparte una publicación o revisa las novedades de tu comunidad.</p>
                {authState.user && <UserStats userId={authState.user.uid} />}
                <div className="d-flex flex-wrap gap-2 mt-4">
                    <Link className="btn btn-primary" to={paths.publish}>Publicar un tweet</Link>
                    <Link className="btn btn-outline-light" to={paths.feed}>Ver feed</Link>
                </div>
            </section>
            <section className="list-group list-group-flush border-top" aria-label="Tu comunidad">
                <Link className="list-group-item list-group-item-action p-3" to={paths.following}>
                    <h2 className="h6 mb-1">Personas que sigues</h2>
                    <p className="text-body-secondary small mb-0">Consulta tus seguidos.</p>
                </Link>
                <Link className="list-group-item list-group-item-action p-3" to={paths.followers}>
                    <h2 className="h6 mb-1">Tus seguidores</h2>
                    <p className="text-body-secondary small mb-0">Consulta quiénes te siguen.</p>
                </Link>
            </section>
        </>
    );
};
