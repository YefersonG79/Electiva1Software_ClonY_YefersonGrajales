
import { demoUser, mockUsers } from './mockUsers';
import type { Relationship } from './types';

const otherUsers = mockUsers.filter((user) => user.uid !== demoUser.uid);

export const mockRelationships: Relationship[] = [
    ...otherUsers.slice(0, 12).map((user) => ({
        followerId: demoUser.uid, followingId: user.uid,
    })),
    ...otherUsers.slice(6, 21).map((user) => ({
        followerId: user.uid, followingId: demoUser.uid,
    })),
    ...otherUsers.flatMap((user, index) =>
        [1, 2, 3].map((offset) => ({
            followerId: user.uid,
            followingId: otherUsers[(index + offset) % otherUsers.length].uid,
        })),
    ),
];
