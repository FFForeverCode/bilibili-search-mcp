import { httpClient } from './client.js';
import { BILIBILI_CONFIG } from '../config/index.js';
import { logger } from '../utils/logger.js';
import { cacheManager } from '../utils/cache.js';
import type { HotVideo, HotContentType } from '../types/index.js';
import type {HotContentToolArgs} from '../types/tools.js';

/**
 * 热门内容服务
 */
export class HotContentService {
    private static instance: HotContentService;

    private constructor() {}

    /**
     * 获取单例实例
     */
    public static getInstance(): HotContentService {
        if (!HotContentService.instance) {
            HotContentService.instance = new HotContentService();
        }
        return HotContentService.instance;
    }

    /**
     * 获取热门内容
     */
    public async getHotContent(params: HotContentToolArgs): Promise<HotVideo[]> {
        const { type = 'all' } = params;

        // 生成缓存键
        const cacheKey = `hot:${type}`;

        // 检查缓存
        const cached = cacheManager.get<HotVideo[]>(cacheKey);
        if (cached) {
            logger.info(`热门内容缓存命中: ${type}`);
            return cached;
        }

        logger.info(`获取热门内容: ${type}`);

        try {
            const hotConfig = BILIBILI_CONFIG.HOT_CONTENT_TYPES[type];
            if (!hotConfig) {
                throw new Error(`不支持的热门类型: ${type}`);
            }

            let url: string;
            let referer: string;

            switch (type) {
                case 'all':
                    url = `${BILIBILI_CONFIG.API_WEB}${BILIBILI_CONFIG.ENDPOINTS.POPULAR}`;
                    referer = `https://www.bilibili.com${hotConfig.referer}`;
                    break;
                case 'history':
                    url = `${BILIBILI_CONFIG.API_WEB}${BILIBILI_CONFIG.ENDPOINTS.PRECIOUS}`;
                    referer = `https://www.bilibili.com${hotConfig.referer}`;
                    break;
                case 'rank':
                    url = `${BILIBILI_CONFIG.API_WEB}${BILIBILI_CONFIG.ENDPOINTS.RANKING}?rid=0&type=all`;
                    referer = `https://www.bilibili.com${hotConfig.referer}`;
                    break;
                case 'music':
                    url = `${BILIBILI_CONFIG.API_WEB}${BILIBILI_CONFIG.ENDPOINTS.RANKING}?rid=3&type=all`;
                    referer = `https://www.bilibili.com${hotConfig.referer}`;
                    break;
                default:
                    throw new Error(`不支持的热门类型: ${type}`);
            }

            // 发送请求
            const response = await httpClient.get<any>(url, {}, referer);

            // 提取视频列表
            let videos: any[] = [];

            // httpClient 已解包 API 响应的 data 字段，此处直接取 list
            videos = response.list || response.data?.list || [];

            // 转换为标准格式
            const results = videos.map((video: any) => this.transformHotVideo(video));

            // 缓存结果（热门内容更新频繁，缓存时间短）
            cacheManager.set(cacheKey, results, 2 * 60 * 1000); // 缓存2分钟

            logger.info(`热门内容获取成功: ${type}，共 ${results.length} 个视频`);
            return results;
        } catch (error) {
            logger.error(`热门内容获取失败: ${type}`, error);
            throw error;
        }
    }

    /**
     * 转换热门视频格式
     */
    private transformHotVideo(video: any): HotVideo {
        const owner = video.owner || {};
        const stat = video.stat || {};

        return {
            bvid: video.bvid || '',
            title: this.cleanTitle(video.title || ''),
            author: owner.name || video.author || '',
            playCount: parseInt(stat.view || video.play || '0') || 0,
            duration: this.formatDuration(video.duration || 0),
            publishDate: this.formatDate(video.pubdate || video.ctime),
            url: video.short_link_v2 || `https://www.bilibili.com/video/${video.bvid}`,
            cover: this.fixUrl(video.pic || ''),
            authorAvatar: this.fixUrl(owner.face || video.upic || ''),
            description: video.desc || video.description || '',
            tag: video.tname || video.tag || ''
        };
    }

    /**
     * 清理标题
     */
    private cleanTitle(title: string): string {
        if (!title) return '';
        return title.replace(/<[^>]*>/g, '').trim();
    }

    /**
     * 格式化时长
     */
    private formatDuration(duration: number | string): string {
        if (typeof duration === 'string') return duration;
        if (typeof duration === 'number') {
            const minutes = Math.floor(duration / 60);
            const seconds = duration % 60;
            return `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
        return '';
    }

    /**
     * 格式化日期
     */
    private formatDate(timestamp: number): string {
        if (!timestamp) return '';
        const dateStr = new Date(timestamp * 1000).toISOString().split('T')[0];
        return dateStr || '';
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
export const hotContentService = HotContentService.getInstance();
