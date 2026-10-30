
import type { User } from '../auth/types/AuthReducerInterfaces';
import type { Relationship, Tweet } from './types';

const sortUsers = (users: User[]) =>
    [...users].sort((first, second) => first.fullName.localeCompare(second.fullName, 'es', { sensitivity: 'base' }));

export const getFollowingUsers = (users: User[], relationships: Relationship[], userId: string) => {
    const ids = new Set(relationships.filter((item) => item.followerId === userId).map((item) => item.followingId));
    return sortUsers(users.filter((user) => ids.has(user.uid)));
};

export const getFollowers = (users: User[], relationships: Relationship[], userId: string) => {
    const ids = new Set(relationships.filter((item) => item.followingId === userId).map((item) => item.followerId));
    return sortUsers(users.filter((user) => ids.has(user.uid)));
};

export const sortTweetsByDate = (tweets: Tweet[]) =>
    [...tweets].sort((first, second) => Date.parse(second.createdAt) - Date.parse(first.createdAt));

export const getFeedTweets = (tweets: Tweet[], relationships: Relationship[], userId: string) => {
    const authorIds = new Set([
        userId,
        ...relationships.filter((item) => item.followerId === userId).map((item) => item.followingId),
    ]);
    return sortTweetsByDate(tweets.filter((tweet) => authorIds.has(tweet.authorId)));
};
