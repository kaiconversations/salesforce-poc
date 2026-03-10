import axios from 'axios';
import * as fs from 'fs';
import * as jwt from 'jsonwebtoken';
import { FastifyBaseLogger } from 'fastify';
import { Config } from '../config/env';

interface SalesforceTokenResponse {
  access_token: string;
  scope: string;
  instance_url: string;
  id: string;
  token_type: string;
}

export class SalesforceAuthService {
  private accessToken: string | null = null;
  private instanceUrl: string | null = null;
  private tokenExpiresAt: number | null = null;

  constructor(
    private config: Config,
    private logger: FastifyBaseLogger
  ) {}

  async getAccessToken(): Promise<string> {
    if (this.accessToken && this.tokenExpiresAt && Date.now() < this.tokenExpiresAt) {
      this.logger.debug('Using cached Salesforce access token');
      return this.accessToken;
    }

    this.logger.info('Requesting new Salesforce access token');
    await this.authenticate();
    return this.accessToken!;
  }

  async getInstanceUrl(): Promise<string> {
    if (!this.instanceUrl) {
      await this.authenticate();
    }
    return this.instanceUrl!;
  }

  private async authenticate(): Promise<void> {
    const jwtToken = this.generateJWT();

    try {
      const response = await axios.post<SalesforceTokenResponse>(
        `${this.config.salesforce.loginUrl}/services/oauth2/token`,
        new URLSearchParams({
          grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
          assertion: jwtToken
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      this.accessToken = response.data.access_token;
      this.instanceUrl = response.data.instance_url;
      // Tokens typically valid for 2 hours, refresh 5 minutes early
      this.tokenExpiresAt = Date.now() + (115 * 60 * 1000);

      this.logger.info({
        instanceUrl: this.instanceUrl,
        tokenType: response.data.token_type
      }, 'Successfully authenticated with Salesforce');

    } catch (error: any) {
      const errorDetails = {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        salesforceError: error.response?.data
      };
      this.logger.error(errorDetails, 'Failed to authenticate with Salesforce');

      // Include Salesforce's error message in the thrown error
      const sfErrorMsg = error.response?.data?.error_description || error.response?.data?.error || 'Unknown error';
      throw new Error(`Salesforce authentication failed: ${sfErrorMsg}`);
    }
  }

  private generateJWT(): string {
    const privateKey = fs.readFileSync(this.config.salesforce.privateKeyPath, 'utf8');

    const payload = {
      iss: this.config.salesforce.clientId,
      sub: this.config.salesforce.username,
      aud: this.config.salesforce.loginUrl,
      exp: Math.floor(Date.now() / 1000) + (5 * 60) // 5 minutes
    };

    return jwt.sign(payload, privateKey, { algorithm: 'RS256' });
  }

  clearCache(): void {
    this.accessToken = null;
    this.instanceUrl = null;
    this.tokenExpiresAt = null;
    this.logger.info('Cleared Salesforce token cache');
  }
}
