require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Gateway, Wallets } = require('fabric-network');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const CONNECTION_PROFILE = path.resolve(__dirname, 'connection-org1.json');
const CHANNEL_NAME       = 'mychannel';
const CHAINCODE_NAME     = 'identity-chaincode';

async function getAdminIdentity() {
  const cert = fs.readFileSync(path.resolve(__dirname, 'admin-cert.pem')).toString();
  const key  = fs.readFileSync(path.resolve(__dirname, 'admin-key.pem')).toString();
  return {
    credentials: { certificate: cert, privateKey: key },
    mspId: 'Org1MSP',
    type: 'X.509'
  };
}

async function newGateway() {
  const ccp    = JSON.parse(fs.readFileSync(CONNECTION_PROFILE, 'utf8'));
  const wallet = await Wallets.newInMemoryWallet();
  await wallet.put('admin', await getAdminIdentity());

  const gateway = new Gateway();
  await gateway.connect(ccp, {
    wallet,
    identity: 'admin',
    discovery: { enabled: false }  // ← DISABLED
  });
  return gateway;
}

app.get('/identities', async (req, res) => {
  const gateway = await newGateway();
  try {
    const network = await gateway.getNetwork(CHANNEL_NAME);
    const contract = network.getContract(CHAINCODE_NAME);
    const result = await contract.evaluateTransaction('GetAllIdentities');
    res.json(JSON.parse(result.toString()));
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    gateway.disconnect();
  }
});

app.post('/identity', async (req, res) => {
  const gateway = await newGateway();
  try {
    const { id, type, data } = req.body;
    const network = await gateway.getNetwork(CHANNEL_NAME);
    const contract = network.getContract(CHAINCODE_NAME);
    const payload = JSON.stringify({ id, type, data });
    const result = await contract.submitTransaction('RegisterIdentity', payload);
    res.json(JSON.parse(result.toString()));
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    gateway.disconnect();
  }
});

app.get('/contract-info', async (req, res) => {
  const gateway = await newGateway();
  try {
    const network = await gateway.getNetwork(CHANNEL_NAME);
    const contract = network.getContract(CHAINCODE_NAME);
    const result = await contract.evaluateTransaction('GetContractInfo');
    res.json(JSON.parse(result.toString()));
  } finally {
    gateway.disconnect();
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
