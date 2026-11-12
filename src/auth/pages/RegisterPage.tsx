
import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { paths } from '../../routes/paths';

const initialForm = { fullName: '', username: '', email: '', password: '' };

export const RegisterPage = () => {
    const { authState, login } = useAuth();
    const [form, setForm] = useState(initialForm);
    const navigate = useNavigate();

    if (authState.logged) return <Navigate to={paths.home} replace />;

    const onInputChange = (event: ChangeEvent<HTMLInputElement>) => {
        setForm((previous) => ({ ...previous, [event.target.name]: event.target.value }));
    };

    const onSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        login(form.username, { fullName: form.fullName.trim(), email: form.email.trim() });
        navigate(paths.home, { replace: true });
    };

    return (
        <div>
            <h1 className="h4 mb-2">Crear cuenta</h1>
            <p className="text-body-secondary mb-4">Completa tus datos para empezar.</p>
            <form onSubmit={onSubmit}>
                <div className="mb-3">
                    <label className="form-label" htmlFor="fullName">Nombre completo</label>
                    <input className="form-control" id="fullName" name="fullName" autoComplete="name" value={form.fullName} onChange={onInputChange} required />
                </div>
                <div className="mb-3">
                    <label className="form-label" htmlFor="username">Nombre de usuario</label>
                    <input className="form-control" id="username" name="username" autoComplete="username" value={form.username} onChange={onInputChange} required />
                </div>
                <div className="mb-3">
                    <label className="form-label" htmlFor="email">Correo electrónico</label>
                    <input className="form-control" id="email" name="email" type="email" autoComplete="email" value={form.email} onChange={onInputChange} required />
                </div>
                <div className="mb-3">
                    <label className="form-label" htmlFor="password">Contraseña</label>
                    <input className="form-control" id="password" name="password" type="password" autoComplete="new-password" value={form.password} onChange={onInputChange} required />
                </div>
                <button className="btn btn-primary w-100" type="submit">Crear cuenta</button>
            </form>
            <p className="text-body-secondary small text-center mt-4 mb-0">¿Ya tienes una cuenta? <Link to={paths.login}>Inicia sesión</Link></p>
        </div>
    );
};
