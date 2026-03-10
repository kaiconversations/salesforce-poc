export interface EnvVars {
  PORT: number;
  NODE_ENV: string;
  LOG_LEVEL: string;
  SALESFORCE_LOGIN_URL: string;
  SALESFORCE_CLIENT_ID: string;
  SALESFORCE_USERNAME: string;
  SALESFORCE_PRIVATE_KEY_PATH: string;
  KAI_API_URL: string;
  KAI_BASIC_AUTH_USERNAME: string;
  KAI_BASIC_AUTH_PASSWORD: string;
}

export interface Config {
  port: number;
  nodeEnv: string;
  logLevel: string;
  salesforce: {
    loginUrl: string;
    clientId: string;
    username: string;
    privateKeyPath: string;
  };
  kai: {
    apiUrl: string;
    username: string;
    password: string;
  };
}

export const configSchema = {
  type: 'object',
  required: [
    'PORT',
    'SALESFORCE_LOGIN_URL',
    'SALESFORCE_CLIENT_ID',
    'SALESFORCE_USERNAME',
    'SALESFORCE_PRIVATE_KEY_PATH',
    'KAI_API_URL',
    'KAI_BASIC_AUTH_USERNAME',
    'KAI_BASIC_AUTH_PASSWORD'
  ],
  properties: {
    PORT: { type: 'number', default: 3000 },
    NODE_ENV: { type: 'string', default: 'development' },
    LOG_LEVEL: { type: 'string', default: 'info' },
    SALESFORCE_LOGIN_URL: { type: 'string' },
    SALESFORCE_CLIENT_ID: { type: 'string' },
    SALESFORCE_USERNAME: { type: 'string' },
    SALESFORCE_PRIVATE_KEY_PATH: { type: 'string' },
    KAI_API_URL: { type: 'string' },
    KAI_BASIC_AUTH_USERNAME: { type: 'string' },
    KAI_BASIC_AUTH_PASSWORD: { type: 'string' }
  }
};

export function getConfig(env: EnvVars): Config {
  return {
    port: env.PORT,
    nodeEnv: env.NODE_ENV,
    logLevel: env.LOG_LEVEL,
    salesforce: {
      loginUrl: env.SALESFORCE_LOGIN_URL,
      clientId: env.SALESFORCE_CLIENT_ID,
      username: env.SALESFORCE_USERNAME,
      privateKeyPath: env.SALESFORCE_PRIVATE_KEY_PATH
    },
    kai: {
      apiUrl: env.KAI_API_URL,
      username: env.KAI_BASIC_AUTH_USERNAME,
      password: env.KAI_BASIC_AUTH_PASSWORD
    }
  };
}
