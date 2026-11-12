import { useState, type FormEvent } from 'react';
import type { User } from '../../auth/types/AuthReducerInterfaces';
import { findUserByUsername } from '../../services/users';
import { errorMessage } from '../../services/errors';
import { UserCard } from './UserCard';

export const UserSearch = () => {
    const [username, setUsername] = useState('');
    const [result, setResult] = useState<User | null>(null);
    const [pending, setPending] = useState(false);
    const [notice, setNotice] = useState('');
    const [error, setError] = useState('');
    const search = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (pending) return;
        setPending(true);
        setError('');
        setNotice('');
        setResult(null);
        try {
            const user = await findUserByUsername(username);
            setResult(user);
            if (!user) setNotice('No se encontró un usuario con ese nombre.');
        } catch (failure) { setError(errorMessage(failure)); }
        finally { setPending(false); }
    };
    return (
        <section className="border-top" aria-label="Buscar usuarios">
            <form className="p-3" onSubmit={search}>
                <label className="form-label" htmlFor="search-username">Seguir por nombre de usuario</label>
                <div className="d-flex gap-2">
                    <input className="form-control" id="search-username" value={username} disabled={pending}
                        onChange={(event) => setUsername(event.target.value)} placeholder="@usuario" required />
                    <button className="btn btn-primary" disabled={pending} type="submit">{pending ? 'Buscando…' : 'Buscar'}</button>
                </div>
                {notice && <p className="text-body-secondary small mt-2 mb-0" role="status">{notice}</p>}
                {error && <p className="text-danger small mt-2 mb-0" role="alert">{error}</p>}
            </form>
            {result && <UserCard key={result.uid} user={result} />}
        </section>
    );
};
