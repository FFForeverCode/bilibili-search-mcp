import axios, {type AxiosInstance, type AxiosRequestConfig } from 'axios';
import { cookieManager } from '../utils/cookie.js';
import { logger } from '../utils/logger.js';
import type { RequestOptions, ApiResponse } from '../types/index.js';
import { HTTP_CONFIG } from '../config/index.js';

/**
 * HTTP 客户端
 * 统一处理请求、Cookie、错误
 */
export class HttpClient {
    private static instance: HttpClient;
    private client: AxiosInstance;

    private constructor() {
        this.client = axios.create({
            timeout: 10000,
            headers: {
                ...HTTP_CONFIG.HEADERS,
                'User-Agent': HTTP_CONFIG.USER_AGENT
            }
        });

        // 请求拦截器
        this.client.interceptors.request.use(
            (config) => {
                logger.debug(`请求: ${config.method?.toUpperCase()} ${config.url}`);
                return config;
            },
            (error) => {
                logger.error('请求拦截器错误', error);
                return Promise.reject(error);
            }
        );

        // 响应拦截器
        this.client.interceptors.response.use(
            (response) => {
                logger.debug(`响应: ${response.status} ${response.config.url}`);
                return response;
            },
            (error) => {
                logger.error(`响应错误: ${error.message}`, {
                    url: error.config?.url,
                    status: error.response?.status,
                    data: error.response?.data
                });
                return Promise.reject(error);
            }
        );
    }

    /**
     * 获取单例实例
     */
    public static getInstance(): HttpClient {
        if (!HttpClient.instance) {
            HttpClient.instance = new HttpClient();
        }
        return HttpClient.instance;
    }

    /**
     * 发送请求
     */
    public async request<T = any>(options: RequestOptions): Promise<T> {
        try {
            // 获取 Cookie
            const cookieString = await cookieManager.getCookieString(options.url);

            // 构建配置
            const config: AxiosRequestConfig = {
                method: options.method || 'GET',
                url: options.url,
                headers: {
                    ...options.headers,
                    'Cookie': cookieString,
                    'Referer': options.referer || options.url
                }
            };

            // 添加查询参数
            if (options.params) {
                if (config.method === 'GET') {
                    config.params = options.params;
                } else {
                    config.data = options.params;
                }
            }

            // 发送请求
            const response = await this.client.request<ApiResponse<T>>(config);

            // 检查响应
            const { data } = response;

            if (data.code !== 0) {
                throw new Error(`API 错误: ${data.message} (code: ${data.code})`);
            }

            return data.data as T;
        } catch (error) {
            logger.error(`请求失败: ${options.url}`, error);
            throw error;
        }
    }

    /**
     * GET 请求
     */
    public async get<T = any>(url: string, params?: Record<string, any>, referer?: string): Promise<T> {
        return this.request({
            url,
            method: 'GET',
            params: params || {},
            referer: referer || ''
        });
    }

    /**
     * GET 请求（返回二进制数据，用于 protobuf 等接口）
     */
    public async getBuffer(url: string, params?: Record<string, any>, referer?: string): Promise<Buffer> {
        const cookieString = await cookieManager.getCookieString(url);

        const response = await this.client.request<ArrayBuffer>({
            method: 'GET',
            url,
            params: params || {},
            responseType: 'arraybuffer',
            headers: {
                'Cookie': cookieString,
                'Referer': referer || url
            }
        });

        return Buffer.from(response.data);
    }

    /**
     * POST 请求
     */
    public async post<T = any>(url: string, data?: Record<string, any>, referer?: string): Promise<T> {
        return this.request({
            url,
            method: 'POST',
            params: data || {},
            referer: referer || ''
        });
    }
}

/**
 * 快速访问函数
 */
export const httpClient = HttpClient.getInstance();
