import type { User } from '../../auth/types/AuthReducerInterfaces';

export const Avatar = ({ user, large = false }: { user: User; large?: boolean }) => (
    <span className={`avatar d-inline-flex align-items-center justify-content-center flex-shrink-0 rounded-circle bg-secondary-subtle text-secondary-emphasis fw-semibold ${large ? 'avatar-large fs-4' : 'small'}`} aria-hidden="true">
        {user.fullName.split(' ').filter(Boolean).slice(0, 2).map((name) => name[0]).join('')}
    </span>
);
