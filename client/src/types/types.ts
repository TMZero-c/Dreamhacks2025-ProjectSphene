export interface Note {
    id: string;
    title: string;
    content: string;
    userId: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface User {
    id: string;
    name: string;
    email: string;
}
