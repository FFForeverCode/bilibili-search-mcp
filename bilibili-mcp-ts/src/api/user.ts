import { httpClient } from './client.js';
import { BILIBILI_CONFIG } from '../config/index.js';
import { logger } from '../utils/logger.js';
import { cacheManager } from '../utils/cache.js';
import type { UserInfo, UserStats, CompleteUserInfo } from '../types/index.js';
import type {UserInfoToolArgs} from '../types/tools.js';

/**
 * 用户服务
 */
export class UserService {
    private static instance: UserService;

    private constructor() {}

    /**
     * 获取单例实例
     */
    public static getInstance(): UserService {
        if (!UserService.instance) {
            UserService.instance = new UserService();
        }
        return UserService.instance;
    }

    /**
     * 获取用户基本信息
     */
    public async getUserInfo(params: UserInfoToolArgs): Promise<UserInfo> {
        const { uid } = params;
        const userId = typeof uid === 'string' ? parseInt(uid) : uid;

        if (isNaN(userId)) {
            throw new Error(`无效的用户ID: ${uid}`);
        }

        // 生成缓存键
        const cacheKey = `user:info:${userId}`;

        // 检查缓存
        const cached = cacheManager.get<UserInfo>(cacheKey);
        if (cached) {
            logger.info(`用户基本信息缓存命中: ${userId}`);
            return cached;
        }

        logger.info(`获取用户基本信息: ${userId}`);

        try {
            const url = `${BILIBILI_CONFIG.API_X}${BILIBILI_CONFIG.ENDPOINTS.USER_INFO}`;
            const referer = `https://space.bilibili.com/${userId}`;

            const data = await httpClient.get<any>(url, { mid: userId }, referer);

            const userInfo = this.transformUserInfo(data);

            // 缓存结果
            cacheManager.set(cacheKey, userInfo, 60 * 60 * 1000); // 缓存1小时

            logger.info(`用户基本信息获取成功: ${userId} - ${userInfo.name}`);
            return userInfo;
        } catch (error) {
            logger.error(`用户基本信息获取失败: ${userId}`, error);
            throw error;
        }
    }

    /**
     * 获取用户统计数据
     */
    public async getUserStats(params: UserInfoToolArgs): Promise<UserStats> {
        const { uid } = params;
        const userId = typeof uid === 'string' ? parseInt(uid) : uid;

        if (isNaN(userId)) {
            throw new Error(`无效的用户ID: ${uid}`);
        }

        // 生成缓存键
        const cacheKey = `user:stats:${userId}`;

        // 检查缓存
        const cached = cacheManager.get<UserStats>(cacheKey);
        if (cached) {
            logger.info(`用户统计数据缓存命中: ${userId}`);
            return cached;
        }

        logger.info(`获取用户统计数据: ${userId}`);

        try {
            const url = `${BILIBILI_CONFIG.API_X}${BILIBILI_CONFIG.ENDPOINTS.USER_STAT}`;
            const referer = `https://space.bilibili.com/${userId}`;

            const data = await httpClient.get<any>(url, { vmid: userId }, referer);

            const userStats = this.transformUserStats(data);

            // 缓存结果
            cacheManager.set(cacheKey, userStats, 5 * 60 * 1000); // 缓存5分钟

            logger.info(`用户统计数据获取成功: ${userId}`);
            return userStats;
        } catch (error) {
            logger.error(`用户统计数据获取失败: ${userId}`, error);
            throw error;
        }
    }

    /**
     * 获取用户完整信息
     */
    public async getCompleteUserInfo(params: UserInfoToolArgs): Promise<CompleteUserInfo> {
        const { uid } = params;
        const userId = typeof uid === 'string' ? parseInt(uid) : uid;

        if (isNaN(userId)) {
            throw new Error(`无效的用户ID: ${uid}`);
        }

        // 生成缓存键
        const cacheKey = `user:complete:${userId}`;

        // 检查缓存
        const cached = cacheManager.get<CompleteUserInfo>(cacheKey);
        if (cached) {
            logger.info(`用户完整信息缓存命中: ${userId}`);
            return cached;
        }

        logger.info(`获取用户完整信息: ${userId}`);

        try {
            // 并行获取基本信息和统计数据
            const [userInfo, userStats] = await Promise.all([
                this.getUserInfo({ uid: userId }),
                this.getUserStats({ uid: userId })
            ]);

            const completeInfo = { ...userInfo, stats: userStats };

            // 缓存结果
            cacheManager.set(cacheKey, completeInfo, 10 * 60 * 1000); // 缓存10分钟

            logger.info(`用户完整信息获取成功: ${userId}`);
            return completeInfo;
        } catch (error) {
            logger.error(`用户完整信息获取失败: ${userId}`, error);
            throw error;
        }
    }

    /**
     * 转换用户基本信息
     */
    private transformUserInfo(data: any): UserInfo {
        const userInfo: UserInfo = {
            mid: data.mid || 0,
            name: data.name || '',
            sex: data.sex || '保密',
            avatar: this.fixUrl(data.face || ''),
            sign: data.sign || '',
            level: data.level || 0,
            birthday: data.birthday || '',
            fansBadge: data.fans_badge || false
        };

        if (data.official && data.official.role) {
            userInfo.official = {
                role: data.official.role || 0,
                title: data.official.title || '',
                desc: data.official.desc || ''
            };
        }

        return userInfo;
    }

    /**
     * 转换用户统计数据
     */
    private transformUserStats(data: any): UserStats {
        return {
            mid: data.mid || 0,
            following: data.following || 0,
            follower: data.follower || 0
        };
    }

    /**
     * 修复 URL
     */
    private fixUrl(url: string): string {
        if (!url) return '';
        if (url.startsWith('//')) return `https:${url}`;
        return url.replace(/^http:\/\//, 'https://');
    }
}

/**
 * 快速访问函数
 */
export const userService = UserService.getInstance();
