import { Database } from './db';

export type HonoEnv = {
    Bindings: {
        JWT_SECRET: string;
        DATABASE_URL: string;
    };
    Variables: {
        db: Database;
        user: {
            sub: number;
            email: string;
            exp: number;
        };
    };
};
