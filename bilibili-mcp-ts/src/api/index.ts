/**
 * API 模块统一导出
 */

// 客户端
export { httpClient } from './client.js';

// 搜索服务
export { searchService, SearchService } from './search.js';

// 视频服务
export { videoService, VideoService } from './video.js';

// 用户服务
export { userService, UserService } from './user.js';

// 热门内容服务
export { hotContentService, HotContentService } from './hot.js';

// 番剧服务
export { bangumiService, BangumiService } from './bangumi.js';
