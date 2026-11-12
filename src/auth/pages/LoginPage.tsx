
import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { demoUser } from '../../data/mockUsers';
import { paths } from '../../routes/paths';

export const LoginPage = () => {
    const { authState, login } = useAuth();
    const [username, setUsername] = useState(demoUser.username);
    const [password, setPassword] = useState('');
    const navigate = useNavigate();
    const location = useLocation();
    const previousPath: unknown = location.state?.from;
    const destination = typeof previousPath === 'string' && previousPath.startsWith('/')
        && !previousPath.startsWith('//') ? previousPath : paths.home;

    if (authState.logged) {
        return <Navigate to={paths.home} replace />;
    }

    const onSignIn = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        login(username);
        navigate(destination, { replace: true });
    };

    return (
        <div>
            <h1 className="h4 mb-2">Iniciar sesión</h1>
            <p className="text-body-secondary mb-4">Accede a tu cuenta.</p>
            <form onSubmit={onSignIn}>
                <div className="mb-3">
                    <label className="form-label" htmlFor="username">Nombre de usuario</label>
                    <input className="form-control" id="username" name="username" autoComplete="username"
                        value={username} onChange={(event) => setUsername(event.target.value)} required />
                </div>
                <div className="mb-3">
                    <label className="form-label" htmlFor="password">Contraseña</label>
                    <input className="form-control" id="password" name="password" type="password" autoComplete="current-password"
                        value={password} onChange={(event) => setPassword(event.target.value)} required />
                </div>
                <button className="btn btn-primary w-100" type="submit">Iniciar sesión</button>
            </form>
            <p className="text-body-secondary small text-center mt-4 mb-0">¿Aún no tienes cuenta? <Link to={paths.register}>Regístrate</Link></p>
        </div>
    );
};
