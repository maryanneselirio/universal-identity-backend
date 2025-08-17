# Universal Digital Identity Framework (UDIF)

## Module 1: Blockchain-Enabled Digital Twin Creation for Vehicles

### Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment**
   - Update `.env` file with your Kaleido credentials
   - Ensure certificates are properly configured

3. **Start Development Server**
   ```bash
   npm start
   ```

4. **Test API**
   ```bash
   curl http://localhost:3001/health
   ```

### Architecture

- **Blockchain**: Hyperledger Fabric via Kaleido
- **Backend**: Node.js with Express
- **Deployment**: Render.com
- **Authentication**: X.509 certificates

### API Endpoints

- `GET /health` - System health check
- `GET /api/identity/list` - List all identities
- `POST /api/identity/register` - Register new identity
- `GET /api/identity/contract` - Contract information

### Development

- Node.js v22.18.0
- npm 10.9.3
- fabric-network@2.2.20
- Express.js 4.19.2

### Module 1 Implementation Status

- [x] Multi-Agent Coordination System
- [x] Universal Identity Management (Basic)
- [ ] VIN-Based Digital Twins (In Progress)
- [ ] Secure VIN Authentication (Planned)
- [ ] AI-Driven Service Validation (Planned)

### Academic Requirements

**Prof. Omicini (Distributed Systems)**
- Multi-agent coordination protocols
- Byzantine fault tolerance
- Consensus mechanisms
- Distributed identity management

### Files Structure

```
universal-identity-dashboard/
├── app.js                 # Main Express server
├── package.json          # Dependencies
├── connection-org1.json  # Fabric network profile
├── admin-cert.pem       # X.509 certificate
├── admin-key.pem        # Private key
├── .env                 # Environment variables
└── README.md           # This file
```
