import axios, { AxiosInstance } from 'axios';
import { FastifyBaseLogger } from 'fastify';
import { SalesforceAuthService } from './salesforce-auth.service';

export class SalesforceApiService {
  private axiosInstance: AxiosInstance;

  constructor(
    private authService: SalesforceAuthService,
    private logger: FastifyBaseLogger
  ) {
    this.axiosInstance = axios.create();
    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Add auth token to requests
    this.axiosInstance.interceptors.request.use(async (config) => {
      const token = await this.authService.getAccessToken();
      const instanceUrl = await this.authService.getInstanceUrl();

      config.headers.Authorization = `Bearer ${token}`;

      // If URL is relative, prepend instance URL
      if (config.url && !config.url.startsWith('http')) {
        config.url = `${instanceUrl}${config.url}`;
      }

      return config;
    });

    // Handle token expiration
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          this.logger.warn('Salesforce token expired, clearing cache and retrying');
          this.authService.clearCache();

          // Retry the request once
          const originalRequest = error.config;
          if (!originalRequest._retry) {
            originalRequest._retry = true;
            const token = await this.authService.getAccessToken();
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return this.axiosInstance(originalRequest);
          }
        }
        throw error;
      }
    );
  }

  async query<T = any>(soql: string): Promise<T[]> {
    const response = await this.axiosInstance.get('/services/data/v62.0/query', {
      params: { q: soql }
    });
    return response.data.records;
  }

  async getRecord(objectType: string, recordId: string, fields?: string[]): Promise<any> {
    const url = `/services/data/v62.0/sobjects/${objectType}/${recordId}`;
    const response = await this.axiosInstance.get(url, {
      params: fields ? { fields: fields.join(',') } : undefined
    });
    return response.data;
  }

  async createRecord(objectType: string, data: any): Promise<{ id: string; success: boolean }> {
    const url = `/services/data/v62.0/sobjects/${objectType}`;
    try {
      const response = await this.axiosInstance.post(url, data);
      return response.data;
    } catch (error: any) {
      this.logger.error({
        objectType,
        error: error.response?.data || error.message,
        status: error.response?.status
      }, `Failed to create ${objectType} record`);
      throw error;
    }
  }

  async updateRecord(objectType: string, recordId: string, data: any): Promise<void> {
    const url = `/services/data/v62.0/sobjects/${objectType}/${recordId}`;
    try {
      await this.axiosInstance.patch(url, data);
    } catch (error: any) {
      this.logger.error({
        objectType,
        recordId,
        error: error.response?.data || error.message,
        status: error.response?.status
      }, `Failed to update ${objectType} record`);
      throw error;
    }
  }

  async deleteRecord(objectType: string, recordId: string): Promise<void> {
    const url = `/services/data/v62.0/sobjects/${objectType}/${recordId}`;
    await this.axiosInstance.delete(url);
  }

  async customRequest(method: string, path: string, data?: any): Promise<any> {
    const response = await this.axiosInstance.request({
      method,
      url: path,
      data
    });
    return response.data;
  }
}
