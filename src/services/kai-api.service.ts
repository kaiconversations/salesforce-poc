import axios, { AxiosInstance } from 'axios';
import { FastifyBaseLogger } from 'fastify';
import { Config } from '../config/env';

export class KaiApiService {
  private axiosInstance: AxiosInstance;

  constructor(
    private config: Config,
    private logger: FastifyBaseLogger
  ) {
    const authString = Buffer.from(
      `${config.kai.username}:${config.kai.password}`
    ).toString('base64');

    this.axiosInstance = axios.create({
      baseURL: config.kai.apiUrl,
      headers: {
        'Authorization': `Basic ${authString}`,
        'Content-Type': 'application/json'
      }
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    this.axiosInstance.interceptors.request.use((config) => {
      this.logger.debug({
        method: config.method,
        url: config.url
      }, 'Kai API request');
      return config;
    });

    this.axiosInstance.interceptors.response.use(
      (response) => {
        this.logger.debug({
          status: response.status,
          url: response.config.url
        }, 'Kai API response');
        return response;
      },
      (error) => {
        this.logger.error({
          error: error.message,
          status: error.response?.status,
          url: error.config?.url
        }, 'Kai API error');
        throw error;
      }
    );
  }

  async get<T = any>(path: string, params?: any): Promise<T> {
    const response = await this.axiosInstance.get(path, { params });
    return response.data;
  }

  async post<T = any>(path: string, data: any): Promise<T> {
    const response = await this.axiosInstance.post(path, data);
    return response.data;
  }

  async put<T = any>(path: string, data: any): Promise<T> {
    const response = await this.axiosInstance.put(path, data);
    return response.data;
  }

  async patch<T = any>(path: string, data: any): Promise<T> {
    const response = await this.axiosInstance.patch(path, data);
    return response.data;
  }

  async delete<T = any>(path: string): Promise<T> {
    const response = await this.axiosInstance.delete(path);
    return response.data;
  }
}
