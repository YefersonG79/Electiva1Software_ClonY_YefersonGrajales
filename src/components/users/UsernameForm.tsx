import { useState, type FormEvent } from 'react';
import { changeUsername, isUsernameAvailable } from '../../services/users';
import { errorMessage, reportFirestoreError } from '../../services/errors';
import { validateUsername } from '../../services/validation';

export const UsernameForm = ({ currentUsername }: { currentUsername: string }) => {
    const [value, setValue] = useState(currentUsername);
    const [pending, setPending] = useState(false);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');

    const save = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (pending) return;
        setError('');
        setNotice('');
        setPending(true);
        try {
            const username = validateUsername(value);
            if (username === currentUsername) {
                setNotice('Ya utilizas este nombre de usuario.');
                return;
            }
            if (!(await isUsernameAvailable(username))) throw new Error('Este nombre de usuario ya está ocupado.');
            // Availability is advisory; the transaction resolves concurrent reservations.
            const saved = await changeUsername(username);
            setValue(saved);
            setNotice('Tu nombre de usuario se actualizó correctamente.');
        } catch (failure) {
            if (typeof failure === 'object' && failure && 'code' in failure) reportFirestoreError('Cambio de nombre de usuario', failure);
            setError(errorMessage(failure));
        } finally { setPending(false); }
    };

    return (
        <form className="p-3 border-top" onSubmit={save} aria-label="Cambiar nombre de usuario" aria-busy={pending}>
            <h2 className="h6">Nombre de usuario</h2>
            <p className="text-body-secondary small">Nombre actual: <strong>@{currentUsername}</strong></p>
            <label className="form-label" htmlFor="new-username">Nuevo nombre de usuario</label>
            <div className="d-flex gap-2">
                <input className="form-control" id="new-username" name="username" autoComplete="username"
                    value={value} disabled={pending} required aria-describedby="username-help"
                    aria-invalid={!!error} onChange={(event) => { setValue(event.target.value); setError(''); setNotice(''); }} />
                <button className="btn btn-primary text-nowrap" type="submit" disabled={pending}>
                    {pending ? 'Guardando…' : 'Guardar nombre'}
                </button>
            </div>
            <p className="form-text" id="username-help">3–30 letras de la a a la z, números o guiones bajos. Sin espacios.</p>
            {error && <p className="text-danger small mb-0" role="alert">{error}</p>}
            {notice && <p className="text-success small mb-0" role="status">{notice}</p>}
        </form>
    );
};
