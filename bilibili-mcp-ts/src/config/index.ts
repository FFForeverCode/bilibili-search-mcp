/**
 * B站 API 配置
 */
export const BILIBILI_CONFIG = {
    // 基础 URL
    HOME_URL: 'https://www.bilibili.com',
    API_WEB: 'https://api.bilibili.com/x/web-interface',
    API_X: 'https://api.bilibili.com/x',

    // API 端点
    ENDPOINTS: {
        SEARCH: '/search/all/v2',
        VIDEO_DETAIL: '/view',
        POPULAR: '/popular',
        PRECIOUS: '/popular/precious',
        RANKING: '/ranking/v2',
        USER_INFO: '/space/acc/info',
        USER_STAT: '/relation/stat',
        BANGUMI_TIMELINE: '/pgc/web/timeline',
        DANMAKU_SEG: '/v2/dm/web/seg.so',
        COMMENT: '/v2/reply',
        REGION: '/index/top/feed/rcmd'
    },

    // 默认参数
    DEFAULTS: {
        PAGE_SIZE: 20,
        PAGE_NUM: 1,
        MAX_LIMIT: 50,
        COOKIE_MAX_AGE: 30 * 60 * 1000, // 30分钟
        CACHE_TTL: 5 * 60 * 1000, // 5分钟
    },

    // 热门内容类型映射
    HOT_CONTENT_TYPES: {
        all: { url: '/popular', referer: '/v/popular/all/' },
        history: { url: '/popular/precious', referer: '/v/popular/history/' },
        rank: { url: '/ranking/v2?rid=0&type=all', referer: '/v/popular/rank/all' },
        music: { url: '/ranking/v2?rid=3&type=all', referer: '/v/popular/music/' }
    }
} as const;

/**
 * HTTP 请求配置
 */
export const HTTP_CONFIG = {
    USER_AGENT: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36 Edg/134.0.0.0',

    HEADERS: {
        Accept: '*/*',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        Connection: 'keep-alive',
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
        'Sec-Ch-Ua': '"Chromium";v="134", "Not:A-Brand";v="99"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-site'
    }
} as const;

/**
 * MCP Server 配置
 */
export const MCP_CONFIG = {
    NAME: 'bilibili-search',
    VERSION: '1.0.0',

    // 传输模式
    TRANSPORT: {
        STDIO: 'stdio',
        HTTP: 'remote',
        DEFAULT_PORT: 3000
    }
} as const;

/**
 * 日志配置
 */
export const LOG_CONFIG = {
    LEVEL: process.env['LOG_LEVEL'] || 'info',
    ENABLE_COLORS: process.env['NODE_ENV'] !== 'production'
} as const;
