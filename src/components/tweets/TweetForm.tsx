import { useState, type FormEvent } from 'react';
import { useAuth } from '../../auth/hooks/useAuth';
import { Avatar } from '../common/Avatar';
import { validateTweet } from '../../services/validation';
import { errorMessage } from '../../services/errors';

export const TweetForm = ({ onPublish }: { onPublish: (content: string) => Promise<void> }) => {
    const { authState } = useAuth();
    const [content, setContent] = useState('');
    const [pending, setPending] = useState(false);
    const [error, setError] = useState('');
    const length = [...content.trim()].length;

    const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (pending) return;
        setError('');
        setPending(true);
        try { await onPublish(validateTweet(content)); setContent(''); }
        catch (failure) { setError(errorMessage(failure)); }
        finally { setPending(false); }
    };

    return (
        <form className="tweet-form p-3" onSubmit={onSubmit}>
            <div className="d-flex align-items-center gap-2 mb-3">
                {authState.user && <Avatar user={authState.user} />}
                <div className="text-break"><strong>{authState.user?.fullName}</strong><p className="text-body-secondary small mb-0">@{authState.user?.username}</p></div>
            </div>
            <label className="form-label" htmlFor="tweet-content">¿Qué está pasando?</label>
            <textarea className="form-control" id="tweet-content" name="content" rows={6} placeholder="Escribe tu publicación..."
                value={content} disabled={pending} aria-describedby="tweet-length" aria-invalid={length > 280}
                onChange={(event) => setContent(event.target.value)} required />
            {error && <p className="alert alert-danger mt-3" role="alert">{error}</p>}
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mt-3">
                <span id="tweet-length" className={`small ${length > 280 ? 'text-danger' : 'text-body-secondary'}`} aria-live="polite">{length}/280 caracteres</span>
                <button className="btn btn-primary" disabled={pending || !content.trim() || length > 280} type="submit">{pending ? 'Publicando…' : 'Publicar'}</button>
            </div>
        </form>
    );
};
