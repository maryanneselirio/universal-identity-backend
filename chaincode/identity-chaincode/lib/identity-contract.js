'use strict';

const { Contract } = require('fabric-contract-api');

class IdentityContract extends Contract {

    // Initialize the ledger
    async InitLedger(ctx) {
        console.log('Universal Digital Identity Framework - Contract initialized');
        const initData = {
            contractVersion: '1.0.0',
            timestamp: new Date().toISOString(),
            totalIdentities: 0,
            supportedTypes: ['vehicle', 'pet', 'iot']
        };

        await ctx.stub.putState('CONTRACT_INFO', Buffer.from(JSON.stringify(initData)));

        // Emit initialization event
        ctx.stub.setEvent('ContractInitialized', Buffer.from(JSON.stringify({
            version: initData.contractVersion,
            timestamp: initData.timestamp
        })));

        return JSON.stringify(initData);
    }

    // Register new identity with explainable validation
    async RegisterIdentity(ctx, identityDataString) {
        try {
            const identityData = JSON.parse(identityDataString);
            console.log(`Registering identity: ${identityData.id} of type: ${identityData.type}`);

            // Step 1: Validation
            const validationResult = await this.ValidateIdentityData(ctx, identityData);
            if (!validationResult.valid) {
                throw new Error(`Validation failed: ${validationResult.explanation}`);
            }

            // Step 2: Multi-agent consensus
            const consensusResult = await this.SimulateMultiAgentConsensus(ctx, identityData);
            if (!consensusResult.consensusReached) {
                throw new Error(`Consensus failed: ${consensusResult.explanation}`);
            }

            // Step 3: Authentication rules
            const authResult = await this.ApplyAuthenticationRules(ctx, identityData);
            if (!authResult.authenticated) {
                throw new Error(`Authentication failed: ${authResult.explanation}`);
            }

            // Step 4: Store identity
            const identity = {
                id: identityData.id,
                type: identityData.type,
                data: identityData.data,
                registrationTime: new Date().toISOString(),
                validationTrace: validationResult.trace,
                consensusTrace: consensusResult.trace,
                authenticationTrace: authResult.trace,
                status: 'active',
                transactionId: ctx.stub.getTxID(),
                blockNumber: ctx.stub.getTxTimestamp()
            };

            await ctx.stub.putState(identityData.id, Buffer.from(JSON.stringify(identity)));

            // Update stats
            await this.UpdateContractStats(ctx, 'registration');

            // Emit event
            ctx.stub.setEvent('IdentityRegistered', Buffer.from(JSON.stringify({
                identityId: identityData.id,
                type: identityData.type,
                timestamp: identity.registrationTime,
                transactionId: identity.transactionId,
                explanation: authResult.explanation
            })));

            return JSON.stringify({
                success: true,
                identityId: identityData.id,
                transactionId: identity.transactionId,
                explanation: authResult.explanation,
                validationTrace: validationResult.trace,
                consensusVotes: consensusResult.votes
            });

        } catch (error) {
            console.error(`Error in RegisterIdentity: ${error.message}`);
            ctx.stub.setEvent('RegistrationError', Buffer.from(JSON.stringify({
                error: error.message,
                timestamp: new Date().toISOString(),
                transactionId: ctx.stub.getTxID()
            })));
            throw new Error(`Registration failed: ${error.message}`);
        }
    }

    // Validation logic
    async ValidateIdentityData(ctx, identityData) {
        const trace = ['Starting identity data validation'];
        try {
            if (!identityData.id || !identityData.type || !identityData.data) {
                return { valid: false, explanation: 'Missing required fields: id, type, or data', trace: [...trace, '❌ Missing basic info'] };
            }
            trace.push('✅ Basic structure valid');

            if (identityData.type === 'vehicle') {
                if (!identityData.data.vin || identityData.data.vin.length !== 17) {
                    return { valid: false, explanation: 'Invalid VIN format', trace: [...trace, '❌ VIN invalid'] };
                }
                if (identityData.data.mileage < 0) {
                    return { valid: false, explanation: 'Mileage cannot be negative', trace: [...trace, '❌ Mileage invalid'] };
                }
                const currentYear = new Date().getFullYear();
                if (identityData.data.year < 1900 || identityData.data.year > currentYear + 1) {
                    return { valid: false, explanation: 'Invalid year', trace: [...trace, '❌ Year invalid'] };
                }
                trace.push('✅ Vehicle fields validated');
            }
            else if (identityData.type === 'pet') {
                if (!identityData.data.microchipId || identityData.data.microchipId.length < 15) {
                    return { valid: false, explanation: 'Invalid microchip ID', trace: [...trace, '❌ Microchip invalid'] };
                }
                if (identityData.data.age < 0 || identityData.data.age > 30) {
                    return { valid: false, explanation: 'Invalid age', trace: [...trace, '❌ Age invalid'] };
                }
                trace.push('✅ Pet fields validated');
            }
            else if (identityData.type === 'iot') {
                if (!identityData.data.serialNumber || identityData.data.serialNumber.length < 3) {
                    return { valid: false, explanation: 'Invalid serial number', trace: [...trace, '❌ Serial number invalid'] };
                }
                trace.push('✅ IoT fields validated');
            }
            else {
                return { valid: false, explanation: `Unsupported identity type: ${identityData.type}`, trace: [...trace, '❌ Unsupported type'] };
            }

            trace.push('✅ All validations passed');
            return { valid: true, explanation: 'All validations passed successfully', trace };

        } catch (error) {
            return { valid: false, explanation: error.message, trace: [...trace, `❌ Error: ${error.message}`] };
        }
    }

    // Consensus simulation
    async SimulateMultiAgentConsensus(ctx, identityData) {
        const agents = [
            { id: 'device_agent_1', type: 'DeviceAgent', weight: 1 },
            { id: 'coordinator_agent_1', type: 'CoordinatorAgent', weight: 2 },
            { id: 'regional_coord_1', type: 'RegionalCoordinator', weight: 2 }
        ];

        let totalVotes = 0, approvedVotes = 0;
        const trace = ['Initiating consensus'];
        const agentDecisions = [];

        for (const agent of agents) {
            let agentApproval = false;
            let reason = '';

            if (agent.type === 'DeviceAgent') {
                agentApproval = Object.keys(identityData.data).length >= 3;
                reason = agentApproval ? 'Sufficient data' : 'Insufficient data';
            } else if (agent.type === 'CoordinatorAgent') {
                agentApproval = ['vehicle', 'pet', 'iot'].includes(identityData.type);
                reason = agentApproval ? 'Supported type' : 'Unsupported type';
            } else if (agent.type === 'RegionalCoordinator') {
                const existing = await this.ReadIdentity(ctx, identityData.id);
                agentApproval = !existing;
                reason = agentApproval ? 'Unique identity' : 'Duplicate detected';
            }

            totalVotes += agent.weight;
            if (agentApproval) approvedVotes += agent.weight;
            agentDecisions.push({ agent: agent.id, approved: agentApproval, reason });

            trace.push(`${agent.type}: ${agentApproval ? '✅' : '❌'} - ${reason}`);
        }

        const requiredVotes = Math.floor(totalVotes * 2 / 3) + 1;
        const consensusReached = approvedVotes >= requiredVotes;

        return {
            consensusReached,
            votes: approvedVotes,
            totalVotes,
            requiredVotes,
            agentDecisions,
            explanation: consensusReached ?
                `Consensus achieved ${approvedVotes}/${totalVotes}` :
                `Consensus failed ${approvedVotes}/${totalVotes}`,
            trace
        };
    }

    // Authentication rules
    async ApplyAuthenticationRules(ctx, identityData) {
        const trace = ['Applying authentication rules'];
        const existing = await this.ReadIdentity(ctx, identityData.id);
        if (existing) return { authenticated: false, explanation: 'Duplicate identity', trace };

        const requiredFields = this.getRequiredFieldsForType(identityData.type);
        for (const field of requiredFields) {
            if (!identityData.data[field]) {
                return { authenticated: false, explanation: `Missing required field: ${field}`, trace };
            }
        }

        const consistencyCheck = await this.CheckCrossDomainConsistency(ctx, identityData);
        if (!consistencyCheck.consistent) {
            return { authenticated: false, explanation: consistencyCheck.reason, trace };
        }

        return { authenticated: true, explanation: 'All authentication rules passed - identity verified', trace };
    }

    getRequiredFieldsForType(type) {
        switch (type) {
            case 'vehicle': return ['vin', 'make', 'model', 'year'];
            case 'pet': return ['microchipId', 'breed', 'owner'];
            case 'iot': return ['deviceType', 'manufacturer', 'serialNumber'];
            default: return ['id'];
        }
    }

    async CheckCrossDomainConsistency(ctx, identityData) {
        if (identityData.type === 'vehicle') {
            const vinPattern = /^[A-HJ-NPR-Z0-9]{17}$/;
            if (!vinPattern.test(identityData.data.vin)) {
                return { consistent: false, reason: 'VIN format violates standards' };
            }
        }
        if (identityData.type === 'pet') {
            if (identityData.data.microchipId.length !== 15 || !identityData.data.microchipId.startsWith('956')) {
                return { consistent: false, reason: 'Microchip ID invalid' };
            }
        }
        return { consistent: true, reason: 'Cross-domain consistency verified' };
    }

    async ReadIdentity(ctx, identityId) {
        const bytes = await ctx.stub.getState(identityId);
        if (!bytes || !bytes.length) return null;
        return JSON.parse(bytes.toString());
    }

    async GetAllIdentities(ctx) {
        const iterator = await ctx.stub.getStateByRange('', '');
        const identities = [];
        let result = await iterator.next();
        while (!result.done) {
            if (result.value && result.value.value.length > 0) {
                const obj = JSON.parse(result.value.value.toString());
                if (obj.id && obj.type) identities.push(obj);
            }
            result = await iterator.next();
        }
        await iterator.close();
        return JSON.stringify({ identities, totalCount: identities.length, timestamp: new Date().toISOString() });
    }

    async UpdateContractStats(ctx, operation) {
        const statsBytes = await ctx.stub.getState('CONTRACT_INFO');
        if (statsBytes && statsBytes.length > 0) {
            const stats = JSON.parse(statsBytes.toString());
            if (operation === 'registration') {
                stats.totalIdentities = (stats.totalIdentities || 0) + 1;
                stats.lastActivity = new Date().toISOString();
            }
            await ctx.stub.putState('CONTRACT_INFO', Buffer.from(JSON.stringify(stats)));
        }
    }

    async GetContractInfo(ctx) {
        const infoBytes = await ctx.stub.getState('CONTRACT_INFO');
        if (!infoBytes || !infoBytes.length) {
            return JSON.stringify({ contractVersion: '1.0.0', totalIdentities: 0, status: 'Not initialized' });
        }
        return infoBytes.toString();
    }
}

module.exports.contracts = [IdentityContract];
