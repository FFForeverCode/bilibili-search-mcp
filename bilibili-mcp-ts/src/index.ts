#!/usr/bin/env node

/**
 * B站 MCP Server 主入口
 */

import { createServer } from './server/index.js';
import { logger } from './utils/logger.js';

// 创建 MCP Server
const server = createServer();

// 启动服务
server.start().catch((error: any) => {
    logger.error('服务启动失败', error);
    process.exit(1);
});

// 导出 Server（供测试使用）
export { server };
