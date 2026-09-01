/**
 * B站视频搜索结果项
 */
export interface VideoSearchResult {
    bvid: string;
    title: string;
    author: string;
    playCount: number;
    duration: string;
    publishDate: string;
    url: string;
    cover: string;
    authorAvatar: string;
    description?: string;
    tag?: string;
}

/**
 * 视频详情 - UP主信息
 */
export interface VideoOwner {
    mid: number;
    name: string;
    avatar: string;
}

/**
 * 视频详情 - 统计数据
 */
export interface VideoStats {
    view: number;
    danmaku: number;
    reply: number;
    favorite: number;
    coin: number;
    share: number;
    like: number;
}

/**
 * 视频分P信息
 */
export interface VideoPage {
    cid: number;
    page: number;
    title: string;
    duration: number;
}

/**
 * 视频详情
 */
export interface VideoDetail {
    bvid: string;
    aid: number;
    title: string;
    description: string;
    cover: string;
    duration: number;
    publishTime: number;
    createTime: number;
    pages: VideoPage[];
    owner: VideoOwner;
    stats: VideoStats;
    tags: string[];
}

/**
 * UP主基本信息
 */
export interface UserInfo {
    mid: number;
    name: string;
    sex: string;
    avatar: string;
    sign: string;
    level: number;
    birthday?: string;
    fansBadge: boolean;
    official?: {
        role: number;
        title: string;
        desc: string;
    };
}

/**
 * UP主统计数据
 */
export interface UserStats {
    mid: number;
    following: number;
    follower: number;
}

/**
 * 完整UP主信息
 */
export interface CompleteUserInfo extends UserInfo {
    stats: UserStats;
}

/**
 * 热门内容类型
 */
export type HotContentType = 'all' | 'history' | 'rank' | 'music';

/**
 * 热门视频项
 */
export interface HotVideo extends VideoSearchResult {}

/**
 * 番剧时间表 - 单集
 */
export interface BangumiEpisode {
    seasonId: number;
    episodeId: number;
    title: string;
    longTitle?: string;
    pubTime?: string;
    duration: number;
    cover?: string;
}

/**
 * 番剧时间表 - 单日
 */
export interface BangumiDay {
    date: string;
    timestamp: number;
    dayOfWeek: number;
    isToday: boolean;
    episodes: BangumiEpisode[];
}

/**
 * 弹幕信息
 */
export interface DanmakuItem {
    id: number;
    progress: number;
    mode: number;
    fontsize: number;
    color: number;
    midHash: string;
    content: string;
    ctime: number;
    weight: number;
    action: string;
    pool: number;
    idStr: string;
    attr: number;
}

/**
 * 弹幕查询结果
 */
export interface DanmakuResult {
    bvid: string;
    cid: number;
    /** 当前返回的弹幕分段（每段 6 分钟） */
    page: number;
    /** 弹幕分段总数 */
    segmentCount: number;
    /** 分P时长（秒） */
    duration: number;
    /** 本次返回的弹幕数量 */
    total: number;
    danmakus: DanmakuItem[];
}

/**
 * API 通用响应格式
 */
export interface ApiResponse<T = any> {
    code: number;
    message: string;
    data?: T;
    result?: any;
}

/**
 * 请求选项
 */
export interface RequestOptions {
    url: string;
    method?: 'GET' | 'POST';
    params?: Record<string, any>;
    headers?: Record<string, string>;
    referer?: string;
}

/**
 * Cookie 存储
 */
export interface CookieStore {
    jar: any;
    cookieString: string;
    updatedAt: number;
}
