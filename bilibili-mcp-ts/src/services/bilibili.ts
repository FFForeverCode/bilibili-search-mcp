/**
 * B站业务服务层
 * 封装业务逻辑，供 MCP Server 调用
 */

import {
    searchService,
    videoService,
    userService,
    hotContentService,
    bangumiService
} from '../api/index.js';
import type {
    VideoSearchResult,
    VideoDetail,
    CompleteUserInfo,
    HotVideo,
    BangumiDay,
    DanmakuResult
} from '../types/index.js';
import {
    SearchToolArgs,
    VideoDetailToolArgs,
    UserInfoToolArgs,
    HotContentToolArgs,
    BangumiTimelineToolArgs,
    DanmakuToolArgs
} from '../types/tools.js';

/**
 * B站服务类
 */
export class BilibiliService {
    private static instance: BilibiliService;

    private constructor() {}

    /**
     * 获取单例实例
     */
    public static getInstance(): BilibiliService {
        if (!BilibiliService.instance) {
            BilibiliService.instance = new BilibiliService();
        }
        return BilibiliService.instance;
    }

    /**
     * 搜索视频
     */
    public async searchVideos(params: SearchToolArgs): Promise<VideoSearchResult[]> {
        return searchService.searchVideos(params);
    }

    /**
     * 获取视频详情
     */
    public async getVideoDetail(params: VideoDetailToolArgs): Promise<VideoDetail> {
        return videoService.getVideoDetail(params);
    }

    /**
     * 获取弹幕
     */
    public async getDanmaku(params: DanmakuToolArgs): Promise<DanmakuResult> {
        return videoService.getDanmaku(params);
    }

    /**
     * 获取用户基本信息
     */
    public async getUserInfo(params: UserInfoToolArgs): Promise<CompleteUserInfo> {
        return userService.getCompleteUserInfo(params);
    }

    /**
     * 获取用户统计数据
     */
    public async getUserStats(params: UserInfoToolArgs) {
        return userService.getUserStats(params);
    }

    /**
     * 获取热门内容
     */
    public async getHotContent(params: HotContentToolArgs): Promise<HotVideo[]> {
        return hotContentService.getHotContent(params);
    }

    /**
     * 获取番剧时间表
     */
    public async getBangumiTimeline(params: BangumiTimelineToolArgs): Promise<BangumiDay[]> {
        return bangumiService.getBangumiTimeline(params);
    }

    /**
     * 批量获取视频详情（新功能）
     */
    public async batchGetVideoDetails(bvids: string[]): Promise<VideoDetail[]> {
        const results = await Promise.allSettled(
            bvids.map(bvid => videoService.getVideoDetail({ videoId: bvid }))
        );

        return results
            .filter((result): result is PromiseFulfilledResult<VideoDetail> =>
                result.status === 'fulfilled'
            )
            .map(result => result.value);
    }

    /**
     * 获取推荐视频（新功能）
     */
    public async getRecommendVideos(limit: number = 10): Promise<HotVideo[]> {
        return hotContentService.getHotContent({ type: 'all' });
    }
}

/**
 * 快速访问函数
 */
export const bilibiliService = BilibiliService.getInstance();
