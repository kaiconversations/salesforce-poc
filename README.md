# Salesforce-Kai Gateway Service

A lightweight API gateway service that integrates Salesforce and Kai APIs using OAuth 2.0 JWT Bearer Flow and Basic Authentication.

## Features

- **Salesforce Integration**: OAuth 2.0 JWT Bearer Flow (server-to-server)
- **Kai API Integration**: Basic authentication
- **Fastify Framework**: High-performance, low-overhead web framework
- **TypeScript**: Full type safety
- **Docker Support**: Container-ready with Docker and Docker Compose
- **Health Checks**: Built-in health and readiness endpoints
- **Auto Token Refresh**: Automatic Salesforce token management
- **Request Proxying**: Proxy requests to both Salesforce and Kai APIs

## Architecture

```
┌─────────────┐         ┌──────────────────┐         ┌──────────────┐
│             │         │                  │         │              │
│  Client     │────────▶│  Gateway Service │────────▶│  Salesforce  │
│             │         │   (This App)     │         │     API      │
└─────────────┘         │                  │         └──────────────┘
                        │                  │
                        │                  │         ┌──────────────┐
                        │                  │────────▶│   Kai API    │
                        └──────────────────┘         └──────────────┘
```

## Quick Start

### Prerequisites

- Node.js 20+
- Docker and Docker Compose (optional)
- Salesforce org with admin access
- Kai API credentials

### 1. Setup Salesforce Connected App

Follow the detailed guide in [SALESFORCE_SETUP.md](./SALESFORCE_SETUP.md) to:
1. Generate RSA key pair
2. Create Connected App in Salesforce
3. Configure OAuth policies
4. Get Consumer Key

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```bash
# Salesforce
SALESFORCE_LOGIN_URL=https://login.salesforce.com
SALESFORCE_CLIENT_ID=your_consumer_key
SALESFORCE_USERNAME=integration@yourcompany.com
SALESFORCE_PRIVATE_KEY_PATH=./certs/salesforce-private-key.pem

# Kai API
KAI_API_URL=https://api.kai.example.com
KAI_BASIC_AUTH_USERNAME=your_username
KAI_BASIC_AUTH_PASSWORD=your_password
```

### 4. Run Development Server

```bash
npm run dev
```

Server starts at `http://localhost:3000`

### 5. Build and Run with Docker

```bash
docker-compose up --build
```

## API Endpoints

### Health Checks

- `GET /health` - Health check
- `GET /ready` - Readiness check

### Salesforce API

- `GET /api/salesforce/query?q=SOQL` - Execute SOQL query
- `GET /api/salesforce/:objectType/:recordId` - Get record by ID
- `POST /api/salesforce/:objectType` - Create record
- `PATCH /api/salesforce/:objectType/:recordId` - Update record
- `DELETE /api/salesforce/:objectType/:recordId` - Delete record

### Kai API (Proxy)

- `GET /api/kai/*` - Proxy GET requests
- `POST /api/kai/*` - Proxy POST requests
- `PUT /api/kai/*` - Proxy PUT requests
- `PATCH /api/kai/*` - Proxy PATCH requests
- `DELETE /api/kai/*` - Proxy DELETE requests

## Examples

### Query Salesforce Accounts

```bash
curl "http://localhost:3000/api/salesforce/query?q=SELECT+Id,Name+FROM+Account+LIMIT+5"
```

### Get Salesforce Record

```bash
curl http://localhost:3000/api/salesforce/Account/001XXXXXXXXXXXXXXX
```

### Create Salesforce Record

```bash
curl -X POST http://localhost:3000/api/salesforce/Account \
  -H "Content-Type: application/json" \
  -d '{"Name": "Test Account", "Industry": "Technology"}'
```

### Proxy Request to Kai API

```bash
curl http://localhost:3000/api/kai/your-endpoint
```

## Development

### Project Structure

```
├── src/
│   ├── config/
│   │   └── env.ts                # Environment configuration
│   ├── services/
│   │   ├── salesforce-auth.service.ts    # SF OAuth implementation
│   │   ├── salesforce-api.service.ts     # SF API client
│   │   └── kai-api.service.ts            # Kai API client
│   ├── routes/
│   │   ├── health.route.ts       # Health endpoints
│   │   ├── salesforce.route.ts   # Salesforce endpoints
│   │   └── kai.route.ts          # Kai proxy endpoints
│   ├── plugins/
│   │   └── services.plugin.ts    # Service initialization
│   └── index.ts                  # Application entry point
├── certs/                        # Certificates (git-ignored)
├── Dockerfile                    # Container definition
└── docker-compose.yml            # Container orchestration
```

### Scripts

- `npm run dev` - Start development server with auto-reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Run production build
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## Security Considerations

1. **Never commit private keys** - The `.gitignore` excludes `.pem` files
2. **Rotate certificates regularly** - Set expiration reminders
3. **Use dedicated integration user** - Principle of least privilege
4. **Configure IP restrictions** - Restrict access in production
5. **Monitor API usage** - Set up logging and alerting
6. **Use environment variables** - Never hardcode credentials

## Production Deployment

1. **Generate production certificates**
   ```bash
   openssl genrsa -out certs/salesforce-private-key.pem 2048
   openssl req -new -x509 -key certs/salesforce-private-key.pem -out certs/salesforce-certificate.crt -days 365
   ```

2. **Configure production environment**
   - Set `NODE_ENV=production`
   - Use production Salesforce URL
   - Enable IP restrictions
   - Configure CORS properly

3. **Deploy container**
   ```bash
   docker-compose up -d
   ```

4. **Monitor logs**
   ```bash
   docker-compose logs -f gateway
   ```

## Troubleshooting

See [SALESFORCE_SETUP.md](./SALESFORCE_SETUP.md) for common issues and solutions.

## License

MIT