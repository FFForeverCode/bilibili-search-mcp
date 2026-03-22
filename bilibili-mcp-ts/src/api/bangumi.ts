import { httpClient } from './client.js';
import { BILIBILI_CONFIG } from '../config/index.js';
import { logger } from '../utils/logger.js';
import { cacheManager } from '../utils/cache.js';
import type { BangumiDay } from '../types/index.js';
import type {BangumiTimelineToolArgs} from '../types/tools.js';

/**
 * 番剧服务
 */
export class BangumiService {
    private static instance: BangumiService;

    private constructor() {}

    /**
     * 获取单例实例
     */
    public static getInstance(): BangumiService {
        if (!BangumiService.instance) {
            BangumiService.instance = new BangumiService();
        }
        return BangumiService.instance;
    }

    /**
     * 获取番剧时间表
     */
    public async getBangumiTimeline(params: BangumiTimelineToolArgs): Promise<BangumiDay[]> {
        const {
            types = 1,
            before = 6,
            after = 6
        } = params;

        // 生成缓存键
        const cacheKey = `bangumi:timeline:${types}:${before}:${after}`;

        // 检查缓存
        const cached = cacheManager.get<BangumiDay[]>(cacheKey);
        if (cached) {
            logger.info(`番剧时间表缓存命中: types=${types}, before=${before}, after=${after}`);
            return cached;
        }

        logger.info(`获取番剧时间表: types=${types}, before=${before}, after=${after}`);

        try {
            const url = `${BILIBILI_CONFIG.API_X}${BILIBILI_CONFIG.ENDPOINTS.BANGUMI_TIMELINE}`;

            // 发送请求
            const response = await httpClient.get<any>(url, {
                types,
                before,
                after
            }, BILIBILI_CONFIG.HOME_URL);

            // 提取数据
            const timelineData = response.result || [];

            // 转换为标准格式
            const results = timelineData.map((day: any) => this.transformBangumiDay(day));

            // 缓存结果
            cacheManager.set(cacheKey, results, 60 * 60 * 1000); // 缓存1小时

            logger.info(`番剧时间表获取成功: ${results.length} 天`);
            return results;
        } catch (error) {
            logger.error(`番剧时间表获取失败`, error);
            throw error;
        }
    }

    /**
     * 转换单日番剧数据
     */
    private transformBangumiDay(day: any): BangumiDay {
        return {
            date: day.date || '',
            timestamp: day.date_ts || 0,
            dayOfWeek: day.day_of_week || 0,
            isToday: day.is_today || false,
            episodes: (day.episodes || []).map((ep: any) => this.transformEpisode(ep))
        };
    }

    /**
     * 转换单集信息
     */
    private transformEpisode(episode: any): any {
        return {
            seasonId: episode.season_id || 0,
            episodeId: episode.episode_id || 0,
            title: episode.title || '',
            longTitle: episode.long_title || '',
            pubTime: episode.pub_time || '',
            duration: episode.duration || 0,
            cover: this.fixUrl(episode.ep_cover || episode.cover || episode.square_cover || ''),
            published: episode.published || false
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
export const bangumiService = BangumiService.getInstance();
