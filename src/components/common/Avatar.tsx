import type { User } from '../../auth/types/AuthReducerInterfaces';
import { useState } from 'react';

export const Avatar = ({ user, large = false }: { user: User; large?: boolean }) => {
    const [failedUrl, setFailedUrl] = useState('');
    const photoURL = user.photoURL;
    return (
        <span className={`avatar d-inline-flex align-items-center justify-content-center flex-shrink-0 rounded-circle overflow-hidden bg-secondary-subtle text-secondary-emphasis fw-semibold ${large ? 'avatar-large fs-4' : 'small'}`} aria-hidden="true">
            {photoURL?.startsWith('https://') && failedUrl !== photoURL
                ? <img className="w-100 h-100 object-fit-cover" src={photoURL} alt="" referrerPolicy="no-referrer" onError={() => setFailedUrl(photoURL)} />
                : user.fullName.split(' ').filter(Boolean).slice(0, 2).map((name) => name[0]).join('')}
        </span>
    );
};
