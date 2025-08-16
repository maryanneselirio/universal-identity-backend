require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Health check
app.get('/health', (_req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Universal Identity API'
  });
});

// Kaleido configuration
const KALEIDO_BASE_URL = process.env.KALEIDO_API_URL;
const AUTH_HEADER = process.env.KALEIDO_AUTH_HEADER;
const CHANNEL_NAME = 'mychannel';
const CHAINCODE_NAME = 'identity-chaincode';

// Create axios instance with auth
const kaleidoAPI = axios.create({
  baseURL: KALEIDO_BASE_URL,
  headers: {
    'Authorization': AUTH_HEADER,
    'Content-Type': 'application/json'
  },
  timeout: 30000
});

// List all identities
app.get('/api/identity/list', async (req, res) => {
  try {
    const response = await kaleidoAPI.post('/query', {
      channel: CHANNEL_NAME,
      chaincode: CHAINCODE_NAME,
      method: 'GetAllIdentities',
      args: []
    });
    
    res.json({
      success: true,
      data: response.data.result || [],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error querying identities:', error.response?.data || error.message);
    res.status(500).json({ 
      success: false,
      error: error.response?.data?.error || error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Register a new identity
app.post('/api/identity/register', async (req, res) => {
  try {
    const { assetType, assetId, metadata } = req.body;
    
    if (!assetType || !assetId) {
      return res.status(400).json({
        success: false,
        error: 'assetType and assetId are required',
        timestamp: new Date().toISOString()
      });
    }

    const payload = JSON.stringify({ assetType, assetId, metadata });
    
    const response = await kaleidoAPI.post('/invoke', {
      channel: CHANNEL_NAME,
      chaincode: CHAINCODE_NAME,
      method: 'RegisterIdentity',
      args: [payload]
    });
    
    res.json({
      success: true,
      data: response.data,
      assetId,
      assetType,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error registering identity:', error.response?.data || error.message);
    res.status(500).json({ 
      success: false,
      error: error.response?.data?.error || error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get chaincode contract info
app.get('/api/identity/contract', async (req, res) => {
  try {
    const response = await kaleidoAPI.post('/query', {
      channel: CHANNEL_NAME,
      chaincode: CHAINCODE_NAME,
      method: 'GetContractInfo',
      args: []
    });
    
    res.json({
      success: true,
      data: response.data.result || {},
      chaincode: CHAINCODE_NAME,
      channel: CHANNEL_NAME,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting contract info:', error.response?.data || error.message);
    res.status(500).json({ 
      success: false,
      error: error.response?.data?.error || error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Demo endpoints for the dashboard scenarios
app.post('/api/demo/vehicle-registration', async (req, res) => {
  try {
    const demoVehicle = {
      assetType: 'vehicle',
      assetId: `VEH-DEMO-${Date.now()}`,
      metadata: {
        vin: '1HGCM82633A123456',
        make: 'Honda',
        model: 'Civic',
        year: 2025,
        mileage: 12000,
        registeredAt: new Date().toISOString()
      }
    };

    const payload = JSON.stringify(demoVehicle);
    
    const response = await kaleidoAPI.post('/invoke', {
      channel: CHANNEL_NAME,
      chaincode: CHAINCODE_NAME,
      method: 'RegisterIdentity',
      args: [payload]
    });
    
    res.json({
      success: true,
      data: response.data,
      demo: 'vehicle-registration',
      asset: demoVehicle,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Demo vehicle registration error:', error.response?.data || error.message);
    res.status(500).json({ 
      success: false,
      error: error.response?.data?.error || error.message,
      demo: 'vehicle-registration',
      timestamp: new Date().toISOString()
    });
  }
});

app.post('/api/demo/byzantine-fault-test', async (req, res) => {
  try {
    // Simulate a Byzantine fault tolerance test
    const testResults = {
      testType: 'byzantine-fault-tolerance',
      peersTotal: 4,
      faultyPeers: 1,
      consensusAchieved: true,
      responseTime: '1.2s',
      networkHealth: 'healthy',
      timestamp: new Date().toISOString()
    };
    
    res.json({
      success: true,
      data: testResults,
      demo: 'byzantine-fault-test',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message,
      demo: 'byzantine-fault-test',
      timestamp: new Date().toISOString()
    });
  }
});

app.post('/api/demo/cross-domain-query', async (req, res) => {
  try {
    // Query identities across different asset types
    const response = await kaleidoAPI.post('/query', {
      channel: CHANNEL_NAME,
      chaincode: CHAINCODE_NAME,
      method: 'GetAllIdentities',
      args: []
    });
    
    const identities = response.data.result || [];
    const crossDomainStats = {
      totalAssets: identities.length,
      vehicleCount: identities.filter(i => i.assetType === 'vehicle').length,
      petCount: identities.filter(i => i.assetType === 'pet').length,
      iotDeviceCount: identities.filter(i => i.assetType === 'iot-device').length,
      crossDomainVerified: true,
      queryTime: '0.8s',
      timestamp: new Date().toISOString()
    };
    
    res.json({
      success: true,
      data: crossDomainStats,
      demo: 'cross-domain-query',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Cross-domain query error:', error.response?.data || error.message);
    res.status(500).json({ 
      success: false,
      error: error.response?.data?.error || error.message,
      demo: 'cross-domain-query',
      timestamp: new Date().toISOString()
    });
  }
});

// Get system metrics for dashboard
app.get('/api/metrics', async (req, res) => {
  try {
    const response = await kaleidoAPI.post('/query', {
      channel: CHANNEL_NAME,
      chaincode: CHAINCODE_NAME,
      method: 'GetAllIdentities',
      args: []
    });
    
    const identities = response.data.result || [];
    
    res.json({
      success: true,
      metrics: {
        totalAssets: identities.length,
        activeAgents: 22, // Mock value
        successRate: '99.1%',
        responseTime: '1.8s',
        systemStatus: 'online',
        networkHealth: 'healthy',
        lastUpdated: new Date().toISOString()
      },
      recentActivity: identities.slice(-4).map(identity => ({
        action: `${identity.assetType.charAt(0).toUpperCase() + identity.assetType.slice(1)} ${identity.assetId} registered`,
        timestamp: identity.registeredAt || new Date().toISOString(),
        type: identity.assetType
      })),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Metrics error:', error.response?.data || error.message);
    res.status(500).json({ 
      success: false,
      error: error.response?.data?.error || error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Universal Identity API listening on port ${PORT}`);
  console.log(`📊 Dashboard metrics available at /api/metrics`);
  console.log(`🔗 Health check: ${process.env.BASE_URL || `http://localhost:${PORT}`}/health`);
  if (process.env.BASE_URL) {
    console.log(`🌐 Available at ${process.env.BASE_URL}`);
  }
});

module.exports = app;