
import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { errorMessage } from '../../services/errors';
import { paths } from '../../routes/paths';

export const LoginPage = () => {
    const { authState, login, loginWithGoogle } = useAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [pending, setPending] = useState(false);
    const [error, setError] = useState('');
    const location = useLocation();
    const previousPath: unknown = location.state?.from;
    const destination = typeof previousPath === 'string' && previousPath.startsWith('/')
        && !previousPath.startsWith('//') ? previousPath : paths.home;

    if (authState.logged) {
        return <Navigate to={destination} replace state={{ signedIn: true }} />;
    }

    const authenticate = async (google = false) => {
        setError('');
        setPending(true);
        try { if (google) await loginWithGoogle(); else await login(username, password); }
        catch (failure) { setError(errorMessage(failure)); }
        finally { setPending(false); }
    };

    const onSignIn = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!pending) void authenticate();
    };

    return (
        <div>
            <h1 className="h4 mb-2">Iniciar sesión</h1>
            <p className="text-body-secondary mb-4">Accede a tu cuenta.</p>
            {(error || authState.errorMessage) && <p className="alert alert-danger small" role="alert">{error || authState.errorMessage}</p>}
            {authState.loading && <p role="status">Restaurando sesión…</p>}
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
                <button className="btn btn-primary w-100" disabled={pending || authState.loading} type="submit">{pending ? 'Ingresando…' : 'Iniciar sesión'}</button>
            </form>
            <button className="btn btn-outline-light w-100 mt-3" type="button" disabled={pending || authState.loading}
                onClick={() => void authenticate(true)}>Continuar con Google</button>
            <p className="text-body-secondary small text-center mt-4 mb-0">¿Aún no tienes cuenta? <Link to={paths.register}>Regístrate</Link></p>
        </div>
    );
};
