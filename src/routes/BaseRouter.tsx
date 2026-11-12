
import { Navigate, Route, Routes } from 'react-router-dom';
import { LoginPage } from '../auth/pages/LoginPage';
import { RegisterPage } from '../auth/pages/RegisterPage';
import { AuthLayout } from '../components/layout/AuthLayout';
import { MainLayout } from '../components/layout/MainLayout';
import { HomePage } from '../pages/HomePage';
import { PublishTweetPage } from '../pages/PublishTweetPage';
import { ConnectionsPage } from '../pages/ConnectionsPage';
import { UserTweetsPage } from '../pages/UserTweetsPage';
import { FeedPage } from '../pages/FeedPage';
import { paths } from './paths';

export const BaseRouter = () => (
    <Routes>
        <Route element={<AuthLayout />}>
            <Route path={paths.login} element={<LoginPage />} />
            <Route path={paths.register} element={<RegisterPage />} />
        </Route>
        <Route element={<MainLayout />}>
            <Route path={paths.home} element={<HomePage />} />
            <Route path={paths.publish} element={<PublishTweetPage />} />
            <Route path={paths.following} element={<ConnectionsPage mode="following" />} />
            <Route path={paths.followers} element={<ConnectionsPage mode="followers" />} />
            <Route path={paths.userTweets} element={<UserTweetsPage />} />
            <Route path={paths.feed} element={<FeedPage />} />
        </Route>
        <Route path="*" element={<Navigate to={paths.home} replace />} />
    </Routes>
);
