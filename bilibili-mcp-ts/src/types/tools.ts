/**
 * 搜索工具参数
 */
export interface SearchToolArgs {
    keyword: string;
    page?: number;
    limit?: number;
}

/**
 * 热门内容工具参数
 */
export interface HotContentToolArgs {
    type?: 'all' | 'history' | 'rank' | 'music';
}

/**
 * 视频详情工具参数
 */
export interface VideoDetailToolArgs {
    videoId: string;
}

/**
 * UP主信息工具参数
 */
export interface UserInfoToolArgs {
    uid: string | number;
}

/**
 * 番剧时间表工具参数
 */
export interface BangumiTimelineToolArgs {
    types?: number;
    before?: number;
    after?: number;
}

/**
 * 弹幕工具参数
 */
export interface DanmakuToolArgs {
    bvid: string;
    cid?: number;
}

/**
 * 评论工具参数
 */
export interface CommentToolArgs {
    bvid: string;
    page?: number;
    pageSize?: number;
}

/**
 * 分区视频工具参数
 */
export interface RegionVideoToolArgs {
    regionId: number;
    page?: number;
    pageSize?: number;
}
