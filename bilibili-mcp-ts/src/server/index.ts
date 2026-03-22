import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import express, { type Request, type Response } from 'express';
import {
    CallToolRequestSchema,
    ErrorCode,
    ListToolsRequestSchema,
    McpError
} from '@modelcontextprotocol/sdk/types.js';
import { bilibiliService } from '../services/bilibili.js';
import { MCP_CONFIG } from '../config/index.js';
import { logger } from '../utils/logger.js';
import type {
    SearchToolArgs,
    VideoDetailToolArgs,
    UserInfoToolArgs,
    HotContentToolArgs,
    BangumiTimelineToolArgs
} from '../types/tools.js';

/**
 * B站 MCP Server
 */
export class BilibiliMCPServer {
    private server: Server;
    private app?: express.Application;
    private logger = logger.createPrefixedLogger('MCP-Server');

    constructor() {
        this.server = new Server(
            {
                name: MCP_CONFIG.NAME,
                version: MCP_CONFIG.VERSION
            },
            {
                capabilities: {
                    tools: {}
                }
            }
        );

        this.setupToolHandlers();
        this.setupErrorHandlers();
    }

    /**
     * 设置工具处理器
     */
    private setupToolHandlers(): void {
        // 工具列表
        this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
            tools: [
                {
                    name: 'bilibili_search',
                    description: '搜索B站视频，支持关键词、分页和数量限制',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            keyword: {
                                type: 'string',
                                description: '搜索关键词'
                            },
                            page: {
                                type: 'number',
                                description: '页码（默认：1）',
                                minimum: 1,
                                default: 1
                            },
                            limit: {
                                type: 'number',
                                description: '返回结果数量（默认：10，最大：50）',
                                minimum: 1,
                                maximum: 50,
                                default: 10
                            }
                        },
                        required: ['keyword']
                    }
                },
                {
                    name: 'bilibili_video_detail',
                    description: '获取B站视频详情信息，支持BV号或AV号',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            videoId: {
                                type: 'string',
                                description: '视频ID，支持BV号（如：BV1xx411c7mD）或AV号（如：av123456）'
                            }
                        },
                        required: ['videoId']
                    }
                },
                {
                    name: 'bilibili_danmaku',
                    description: '获取B站视频弹幕（新功能）',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            bvid: {
                                type: 'string',
                                description: '视频BV号'
                            },
                            cid: {
                                type: 'number',
                                description: '视频分P ID（可选，不传则自动获取）'
                            }
                        },
                        required: ['bvid']
                    }
                },
                {
                    name: 'bilibili_user_info',
                    description: '获取UP主完整信息（基本信息 + 统计数据）',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            uid: {
                                type: 'string',
                                description: 'UP主的UID（用户ID）'
                            }
                        },
                        required: ['uid']
                    }
                },
                {
                    name: 'bilibili_hot_content',
                    description: '获取B站热门内容（综合热门、入站必刷、排行榜、音乐榜）',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            type: {
                                type: 'string',
                                description: '热门类型：all（综合热门）、history（入站必刷）、rank（排行榜）、music（音乐榜）',
                                enum: ['all', 'history', 'rank', 'music'],
                                default: 'all'
                            }
                        }
                    }
                },
                {
                    name: 'bilibili_bangumi_timeline',
                    description: '获取B站番剧时间表，查询指定时间范围内的番剧播出信息',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            types: {
                                type: 'number',
                                description: '内容类型（默认：1，番剧）',
                                default: 1
                            },
                            before: {
                                type: 'number',
                                description: '获取当前时间之前多少天的播出信息（默认：6天）',
                                minimum: 0,
                                maximum: 7,
                                default: 6
                            },
                            after: {
                                type: 'number',
                                description: '获取当前时间之后多少天的播出信息（默认：6天）',
                                minimum: 0,
                                maximum: 7,
                                default: 6
                            }
                        }
                    }
                }
            ]
        }));

        // 工具调用
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;

            if (!args) {
                throw new McpError(
                    ErrorCode.InvalidParams,
                    `工具 ${name} 缺少参数`
                );
            }

            try {
                switch (name) {
                    case 'bilibili_search':
                        return await this.handleSearch(args as unknown as SearchToolArgs);

                    case 'bilibili_video_detail':
                        return await this.handleVideoDetail(args as unknown as VideoDetailToolArgs);

                    case 'bilibili_danmaku':
                        return await this.handleDanmaku(args as any);

                    case 'bilibili_user_info':
                        return await this.handleUserInfo(args as unknown as UserInfoToolArgs);

                    case 'bilibili_hot_content':
                        return await this.handleHotContent(args as unknown as HotContentToolArgs);

                    case 'bilibili_bangumi_timeline':
                        return await this.handleBangumiTimeline(args as unknown as BangumiTimelineToolArgs);

                    default:
                        throw new McpError(
                            ErrorCode.MethodNotFound,
                            `未知工具: ${name}`
                        );
                }
            } catch (error) {
                return this.handleError(error, name);
            }
        });
    }

    /**
     * 处理搜索请求
     */
    private async handleSearch(args: SearchToolArgs) {
        const results = await bilibiliService.searchVideos(args);

        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(results, null, 2)
                }
            ]
        };
    }

    /**
     * 处理视频详情请求
     */
    private async handleVideoDetail(args: VideoDetailToolArgs) {
        const result = await bilibiliService.getVideoDetail(args);

        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(result, null, 2)
                }
            ]
        };
    }

    /**
     * 处理弹幕请求
     */
    private async handleDanmaku(args: any) {
        const result = await bilibiliService.getDanmaku(args);

        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(result, null, 2)
                }
            ]
        };
    }

    /**
     * 处理用户信息请求
     */
    private async handleUserInfo(args: UserInfoToolArgs) {
        const result = await bilibiliService.getUserInfo(args);

        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(result, null, 2)
                }
            ]
        };
    }

    /**
     * 处理热门内容请求
     */
    private async handleHotContent(args: HotContentToolArgs) {
        const results = await bilibiliService.getHotContent(args);

        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(results, null, 2)
                }
            ]
        };
    }

    /**
     * 处理番剧时间表请求
     */
    private async handleBangumiTimeline(args: BangumiTimelineToolArgs) {
        const results = await bilibiliService.getBangumiTimeline(args);

        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(results, null, 2)
                }
            ]
        };
    }

    /**
     * 设置错误处理器
     */
    private setupErrorHandlers(): void {
        this.server.onerror = (error) => {
            this.logger.error('MCP Server 错误', error);
        };

        process.on('SIGINT', async () => {
            this.logger.info('收到 SIGINT 信号，正在关闭服务...');
            await this.close();
            process.exit(0);
        });

        process.on('SIGTERM', async () => {
            this.logger.info('收到 SIGTERM 信号，正在关闭服务...');
            await this.close();
            process.exit(0);
        });
    }

    /**
     * 处理错误
     */
    private handleError(error: any, toolName: string) {
        this.logger.error(`工具执行失败: ${toolName}`, error);

        const errorMessage = error instanceof Error
            ? error.message
            : String(error);

        return {
            content: [
                {
                    type: 'text',
                    text: `错误: ${errorMessage}`
                }
            ],
            isError: true
        };
    }

    /**
     * 启动服务
     */
    public async start(): Promise<void> {
        const transportType = process.env['TRANSPORT'] || MCP_CONFIG.TRANSPORT.STDIO;

        if (transportType === MCP_CONFIG.TRANSPORT.HTTP) {
            await this.startHttpServer();
        } else {
            await this.startStdioServer();
        }
    }

    /**
     * 启动 HTTP 服务
     */
    private async startHttpServer(): Promise<void> {
        const port = parseInt(process.env['PORT'] || String(MCP_CONFIG.TRANSPORT.DEFAULT_PORT));

        this.app = express();
        this.app.use(express.json());

        this.app.post('/mcp', async (req: Request, res: Response) => {
            const transport = new StreamableHTTPServerTransport({
                enableJsonResponse: true
            });

            res.on('close', () => {
                transport.close();
            });

            await this.server.connect(transport as any);
            await transport.handleRequest(req as any, res, req.body);
        });

        this.app.listen(port, () => {
            this.logger.info(`HTTP MCP Server 运行在 http://localhost:${port}/mcp`);
        }).on('error', (error: any) => {
            this.logger.error('Server 启动失败', error);
            process.exit(1);
        });
    }

    /**
     * 启动 STDIO 服务
     */
    private async startStdioServer(): Promise<void> {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        this.logger.info('STDIO MCP Server 已启动');
    }

    /**
     * 关闭服务
     */
    public async close(): Promise<void> {
        await this.server.close();
        this.logger.info('MCP Server 已关闭');
    }
}

/**
 * 快速访问函数
 */
export const createServer = (): BilibiliMCPServer => {
    return new BilibiliMCPServer();
};
