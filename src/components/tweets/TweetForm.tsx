import { useState, type FormEvent } from 'react';
import { useAuth } from '../../auth/hooks/useAuth';
import { Avatar } from '../common/Avatar';

export const TweetForm = ({ onPublish }: { onPublish: (content: string) => void }) => {
    const { authState } = useAuth();
    const [content, setContent] = useState('');

    const onSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!content.trim()) return;
        onPublish(content);
        setContent('');
    };

    return (
        <form className="tweet-form p-3" onSubmit={onSubmit}>
            <div className="d-flex align-items-center gap-2 mb-3">
                {authState.user && <Avatar user={authState.user} />}
                <div className="text-break"><strong>{authState.user?.fullName}</strong><p className="text-body-secondary small mb-0">@{authState.user?.username}</p></div>
            </div>
            <label className="form-label" htmlFor="tweet-content">¿Qué está pasando?</label>
            <textarea className="form-control" id="tweet-content" name="content" rows={6} placeholder="Escribe tu publicación..."
                value={content} onChange={(event) => setContent(event.target.value)} required />
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mt-3">
                <span className="text-body-secondary small">Comparte una idea con tu comunidad.</span>
                <button className="btn btn-primary" disabled={!content.trim()} type="submit">Publicar</button>
            </div>
        </form>
    );
};
