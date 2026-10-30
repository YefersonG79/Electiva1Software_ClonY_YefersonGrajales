
export interface Tweet {
    id: string;
    authorId: string;
    content: string;
    createdAt: string;
}

export interface Relationship {
    followerId: string;
    followingId: string;
}
