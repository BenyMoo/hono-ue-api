import { hash, compare } from 'bcryptjs';

/**
 * 异步哈希密码。
 *
 * @param password 要哈希的明文密码。
 * @returns 密码的哈希值。
 */
export const hashPassword = async (password: string): Promise<string> => {
    return await hash(password, 10);
};

/**
 * 异步验证密码。
 *
 * @param password 用户输入的明文密码。
 * @param hash 存储的密码哈希值。
 * @returns 如果密码匹配哈希值，则为 true；否则为 false。
 */
export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
    return await compare(password, hash);
};
