export declare const useSqlite: () => boolean;
export declare function initDb(): Promise<void>;
export declare function query<T = Record<string, unknown>>(text: string, params?: unknown[]): Promise<{
    rows: T[];
    rowCount: number;
}>;
export declare function getPool(): import('pg').Pool | null;
declare const _default: {
    initDb: typeof initDb;
    query: typeof query;
    useSqlite: () => boolean;
    getPool: typeof getPool;
};
export default _default;
