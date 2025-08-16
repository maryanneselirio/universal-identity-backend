if [ ! -f README.md ]; then
  echo "Creating README.md..."
  cat <<EOF > README.md
# Universal Digital Identity Framework Backend

This repository contains:
- `chaincode/identity-chaincode`: Hyperledger Fabric chaincode for generic identity management.
- `universal-identity-dashboard`: Node.js backend API and example dashboard for registering and querying assets via Kaleido.

## Setup

1. Configure environment variables for Kaleido:
   - KALEIDO_API_URL
   - KALEIDO_APP_CRED_ID
   - KALEIDO_APP_CRED_PASSWORD
   - KALEIDO_AUTH_HEADER
2. Install dependencies:
   ```
   cd chaincode/identity-chaincode && npm install
   cd ../../universal-identity-dashboard && npm install
   ```
3. Run backend:
   ```
   cd universal-identity-dashboard
   npm start
   ```

## License

No license—patent pending. All rights reserved.
