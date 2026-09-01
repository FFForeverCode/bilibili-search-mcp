import { httpClient } from './client.js';
import { BILIBILI_CONFIG } from '../config/index.js';
import { logger } from '../utils/logger.js';
import { cacheManager } from '../utils/cache.js';
import type { VideoDetail, DanmakuItem, DanmakuResult } from '../types/index.js';
import type { VideoDetailToolArgs, DanmakuToolArgs } from '../types/tools.js';
import protobuf from 'protobufjs';

/**
 * 弹幕 protobuf 定义（DmSegMobileReply）
 * 参考: https://github.com/SocialSisterYi/bilibili-API-collect
 */
const DANMAKU_PROTO = `
syntax = "proto3";
package bilibili.community.service.dm.v1;

message DanmakuElem {
    int64 id = 1;
    int32 progress = 2;
    int32 mode = 3;
    int32 fontsize = 4;
    uint32 color = 5;
    string midHash = 6;
    string content = 7;
    int64 ctime = 8;
    int32 weight = 9;
    string action = 10;
    int32 pool = 11;
    string idStr = 12;
    int32 attr = 13;
}

message DmSegMobileReply {
    repeated DanmakuElem elems = 1;
}
`;

const DM_SEG_MOBILE_REPLY = protobuf
    .parse(DANMAKU_PROTO)
    .root
    .lookupType('bilibili.community.service.dm.v1.DmSegMobileReply');

/** 每个弹幕分段覆盖的视频时长（秒） */
const DANMAKU_SEGMENT_DURATION = 360;

/**
 * 视频服务
 */
export class VideoService {
    private static instance: VideoService;

    private constructor() {}

    /**
     * 获取单例实例
     */
    public static getInstance(): VideoService {
        if (!VideoService.instance) {
            VideoService.instance = new VideoService();
        }
        return VideoService.instance;
    }

    /**
     * 获取视频详情
     */
    public async getVideoDetail(params: VideoDetailToolArgs): Promise<VideoDetail> {
        const { videoId } = params;

        // 验证视频ID格式
        if (!this.isValidVideoId(videoId)) {
            throw new Error(`无效的视频ID格式: ${videoId}。请提供BV号（如：BV1xx411c7mD）或AV号（如：av123456）`);
        }

        // 生成缓存键
        const cacheKey = `video:${videoId}`;

        // 检查缓存
        const cached = cacheManager.get<VideoDetail>(cacheKey);
        if (cached) {
            logger.info(`视频详情缓存命中: ${videoId}`);
            return cached;
        }

        logger.info(`获取视频详情: ${videoId}`);

        try {
            // 构建请求参数
            const isBV = videoId.startsWith('BV');
            const params = isBV ? { bvid: videoId } : { aid: videoId.replace('av', '') };
            const url = `${BILIBILI_CONFIG.API_WEB}${BILIBILI_CONFIG.ENDPOINTS.VIDEO_DETAIL}`;
            const referer = `https://www.bilibili.com/video/${videoId}`;

            // 发送请求
            const data = await httpClient.get<any>(url, params, referer);

            // 转换为标准格式
            const detail = this.transformVideoDetail(data);

            // 缓存结果
            cacheManager.set(cacheKey, detail, 10 * 60 * 1000); // 缓存10分钟

            logger.info(`视频详情获取成功: ${videoId} - ${detail.title}`);
            return detail;
        } catch (error) {
            logger.error(`视频详情获取失败: ${videoId}`, error);
            throw error;
        }
    }

    /**
     * 获取弹幕（protobuf 实时弹幕包，按 6 分钟分段返回）
     */
    public async getDanmaku(params: DanmakuToolArgs): Promise<DanmakuResult> {
        const { bvid, cid, dmType = 1, page = 1 } = params;

        logger.info(`获取弹幕: ${bvid} (cid: ${cid || '自动获取'}, page: ${page})`);

        // 检查缓存
        const cacheKey = `danmaku:${bvid}:${cid ?? 'auto'}:${dmType}:${page}`;
        const cached = cacheManager.get<DanmakuResult>(cacheKey);
        if (cached) {
            logger.info(`弹幕缓存命中: ${cacheKey}`);
            return cached;
        }

        try {
            // 通过视频详情确定目标分P（同时拿到分P时长用于计算分段数）
            const videoDetail = await this.getVideoDetail({ videoId: bvid });
            const targetPage = cid
                ? videoDetail.pages.find(p => p.cid === cid)
                : videoDetail.pages[0];

            if (!targetPage) {
                throw new Error(
                    cid
                        ? `视频 ${bvid} 不存在 cid 为 ${cid} 的分P`
                        : `无法获取视频 ${bvid} 的 CID`
                );
            }

            // 校验分段页码范围
            const segmentCount = Math.max(1, Math.ceil(targetPage.duration / DANMAKU_SEGMENT_DURATION));
            if (page < 1 || page > segmentCount) {
                throw new Error(`page 超出范围: 该分P共 ${segmentCount} 个弹幕分段（每段 6 分钟），当前请求 page=${page}`);
            }

            // 请求 protobuf 弹幕包
            const url = `${BILIBILI_CONFIG.API_X}${BILIBILI_CONFIG.ENDPOINTS.DANMAKU_SEG}`;
            const referer = `https://www.bilibili.com/video/${bvid}`;
            const buffer = await httpClient.getBuffer(url, {
                type: dmType,
                oid: targetPage.cid,
                segment_index: page
            }, referer);

            // 解析 protobuf 并转换为标准格式
            const message = DM_SEG_MOBILE_REPLY.decode(new Uint8Array(buffer));
            const { elems } = DM_SEG_MOBILE_REPLY.toObject(message, {
                longs: Number,
                defaults: true
            }) as { elems?: any[] };

            const danmakus = (elems || [])
                .map(elem => this.transformDanmaku(elem))
                .sort((a, b) => a.progress - b.progress);

            const result: DanmakuResult = {
                bvid,
                cid: targetPage.cid,
                page,
                segmentCount,
                duration: targetPage.duration,
                total: danmakus.length,
                danmakus
            };

            // 缓存结果
            cacheManager.set(cacheKey, result, 5 * 60 * 1000); // 缓存5分钟

            logger.info(`弹幕获取成功: ${bvid}，第 ${page}/${segmentCount} 段，共 ${danmakus.length} 条`);
            return result;
        } catch (error) {
            logger.error(`弹幕获取失败: ${bvid}`, error);
            throw error;
        }
    }

    /**
     * 转换弹幕格式
     */
    private transformDanmaku(elem: any): DanmakuItem {
        return {
            id: Number(elem.id) || 0,
            progress: Number(elem.progress) || 0,
            mode: elem.mode ?? 0,
            fontsize: elem.fontsize ?? 0,
            color: elem.color ?? 0,
            midHash: elem.midHash ?? '',
            content: elem.content ?? '',
            ctime: Number(elem.ctime) || 0,
            weight: elem.weight ?? 0,
            action: elem.action ?? '',
            pool: elem.pool ?? 0,
            idStr: elem.idStr ?? '',
            attr: elem.attr ?? 0
        };
    }

    /**
     * 验证视频ID格式
     */
    private isValidVideoId(videoId: string): boolean {
        return /^BV[a-zA-Z0-9]{10}$/.test(videoId) ||
            /^av\d+$/.test(videoId) ||
            /^\d+$/.test(videoId);
    }

    /**
     * 转换视频详情格式
     */
    private transformVideoDetail(data: any): VideoDetail {
        return {
            bvid: data.bvid,
            aid: data.aid,
            title: data.title,
            description: data.desc || '',
            cover: this.fixUrl(data.pic || ''),
            duration: data.duration || 0,
            publishTime: data.pubdate || 0,
            createTime: data.ctime || 0,
            pages: (data.pages || []).map((page: any) => ({
                cid: page.cid,
                page: page.page,
                title: page.part || '',
                duration: page.duration || 0
            })),
            owner: {
                mid: data.owner?.mid || 0,
                name: data.owner?.name || '',
                avatar: this.fixUrl(data.owner?.face || '')
            },
            stats: {
                view: data.stat?.view || 0,
                danmaku: data.stat?.danmaku || 0,
                reply: data.stat?.reply || 0,
                favorite: data.stat?.favorite || 0,
                coin: data.stat?.coin || 0,
                share: data.stat?.share || 0,
                like: data.stat?.like || 0
            },
            tags: (data.tname || '').split(',')
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
export const videoService = VideoService.getInstance();
