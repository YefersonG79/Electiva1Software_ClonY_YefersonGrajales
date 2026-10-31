
export const paths = {
    home: '/',
    login: '/login',
    register: '/register',
    publish: '/publish',
    following: '/following',
    followers: '/followers',
    userTweets: '/users/:username',
    feed: '/feed',
} as const;

export const getUserTweetsPath = (username: string) =>
    `/users/${encodeURIComponent(username)}`;
