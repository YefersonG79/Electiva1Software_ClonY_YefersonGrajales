import { Link } from 'react-router-dom';
import { useAuth } from '../auth/hooks/useAuth';
import { PageHeading } from '../components/common/PageHeading';
import { UsernameForm } from '../components/users/UsernameForm';
import { getUserTweetsPath } from '../routes/paths';

export const ProfileSettingsPage = () => {
    const { authState } = useAuth();
    const user = authState.user;
    if (!user) return null;
    return (
        <>
            <PageHeading title="Editar perfil" subtitle="Personaliza tu nombre de usuario" />
            <UsernameForm currentUsername={user.username} />
            <Link className="align-self-start m-3" to={getUserTweetsPath(user.username)}>Volver a mi perfil</Link>
        </>
    );
};
