import { httpClient } from './client.js';
import { BILIBILI_CONFIG } from '../config/index.js';
import { logger } from '../utils/logger.js';
import { cacheManager } from '../utils/cache.js';
import type { VideoSearchResult } from '../types/index.js';
import type { SearchToolArgs } from '../types/tools.js';

/**
 * 搜索服务
 */
export class SearchService {
    private static instance: SearchService;

    private constructor() {}

    /**
     * 获取单例实例
     */
    public static getInstance(): SearchService {
        if (!SearchService.instance) {
            SearchService.instance = new SearchService();
        }
        return SearchService.instance;
    }

    /**
     * 搜索视频
     */
    public async searchVideos(params: SearchToolArgs): Promise<VideoSearchResult[]> {
        const { keyword, page = 1, limit = 10 } = params;

        // 生成缓存键
        const cacheKey = cacheManager.generateKey('search', {
            keyword,
            page,
            limit
        });

        // 检查缓存
        const cached = cacheManager.get<VideoSearchResult[]>(cacheKey);
        if (cached) {
            logger.info(`搜索缓存命中: ${keyword} (第 ${page} 页)`);
            return cached;
        }

        logger.info(`开始搜索: ${keyword} (第 ${page} 页, 限制: ${limit})`);

        try {
            // 构建请求 URL
            const encodedKeyword = encodeURIComponent(keyword);
            const url = `${BILIBILI_CONFIG.API_WEB}${BILIBILI_CONFIG.ENDPOINTS.SEARCH}`;

            // 发送请求
            const response = await httpClient.get<any>(url, {
                keyword: encodedKeyword,
                page,
                pagesize: limit
            }, `https://search.bilibili.com/all?keyword=${encodedKeyword}`);

            // 提取视频数据
            const videoResult = response.result?.find((item: any) => item.result_type === 'video');
            const videos = videoResult?.data || [];

            // 转换为标准格式
            const results = videos.map((video: any) => this.transformVideo(video));

            // 缓存结果
            cacheManager.set(cacheKey, results);

            logger.info(`搜索完成: ${keyword}，找到 ${results.length} 个结果`);
            return results;
        } catch (error) {
            logger.error(`搜索失败: ${keyword}`, error);
            throw error;
        }
    }

    /**
     * 转换视频数据格式
     */
    private transformVideo(video: any): VideoSearchResult {
        return {
            bvid: video.bvid || '',
            title: this.cleanTitle(video.title || ''),
            author: video.author || video.owner?.name || '',
            playCount: parseInt(video.play || video.stat?.view || '0') || 0,
            duration: this.formatDuration(video.duration),
            publishDate: this.formatDate(video.pubdate || video.ctime),
            url: video.arcurl || `https://www.bilibili.com/video/${video.bvid}`,
            cover: this.fixUrl(video.pic || ''),
            authorAvatar: this.fixUrl(video.upic || video.owner?.face || ''),
            description: video.description || video.desc || '',
            tag: video.tag || video.tname || ''
        };
    }

    /**
     * 清理标题中的 HTML 标签
     */
    private cleanTitle(title: string): string {
        if (!title) return '';
        return title.replace(/<em class="keyword">(.*?)<\/em>/g, '$1')
            .replace(/<[^>]*>/g, '')
            .trim();
    }

    /**
     * 格式化时长
     */
    private formatDuration(duration: string | number): string {
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
     * 修复 URL（处理 // 开头的 URL）
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
export const searchService = SearchService.getInstance();
