
export const paths = {
    home: '/',
    login: '/login',
    register: '/register',
    publish: '/publish',
    following: '/following',
    followers: '/followers',
    userTweets: '/users/:username',
    userFollowing: '/users/:userId/following',
    userFollowers: '/users/:userId/followers',
    profileSettings: '/settings/profile',
    feed: '/feed',
} as const;

export const getUserTweetsPath = (username: string) =>
    `/users/${encodeURIComponent(username)}`;

export const getUserConnectionsPath = (userId: string, mode: 'following' | 'followers') =>
    `/users/${encodeURIComponent(userId)}/${mode}`;
