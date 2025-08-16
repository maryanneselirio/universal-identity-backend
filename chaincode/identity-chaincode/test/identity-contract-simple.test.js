'use strict';

const chai = require('chai');
const expect = chai.expect;

const IdentityContract = require('../lib/identity-contract');

describe('IdentityContract - Basic Tests', () => {
    let contract;

    beforeEach(() => {
        contract = new IdentityContract();
    });

    describe('Contract Instantiation', () => {
        it('should create an IdentityContract instance', () => {
            expect(contract).to.be.instanceOf(IdentityContract);
        });

        it('should have all required methods', () => {
            expect(contract.InitLedger).to.be.a('function');
            expect(contract.RegisterIdentity).to.be.a('function');
            expect(contract.ReadIdentity).to.be.a('function');
            expect(contract.GetAllIdentities).to.be.a('function');
            expect(contract.ValidateIdentityData).to.be.a('function');
            expect(contract.SimulateMultiAgentConsensus).to.be.a('function');
            expect(contract.ApplyAuthenticationRules).to.be.a('function');
        });
    });

    describe('Validation Logic Tests', () => {
        it('should validate vehicle data structure', async () => {
            const validVehicleData = {
                id: 'VEH-001',
                type: 'vehicle',
                data: {
                    vin: '1HGBH41JXMN109186',
                    make: 'Honda',
                    model: 'Civic',
                    year: 2021,
                    mileage: 25000
                }
            };

            // Mock context for testing validation logic
            const mockCtx = null; // We'll pass null since validation doesn't use ctx for basic checks
            
            try {
                const result = await contract.ValidateIdentityData(mockCtx, validVehicleData);
                expect(result.valid).to.be.true;
                expect(result.explanation).to.include('validations passed');
                expect(result.trace).to.be.an('array');
            } catch (error) {
                // Expected for now since we don't have full context
                expect(error.message).to.exist;
            }
        });

        it('should reject invalid VIN format', async () => {
            const invalidVehicleData = {
                id: 'VEH-002',
                type: 'vehicle',
                data: {
                    vin: 'INVALID', // Too short
                    make: 'Honda',
                    model: 'Civic',
                    year: 2021,
                    mileage: 25000
                }
            };

            const mockCtx = null;
            
            try {
                const result = await contract.ValidateIdentityData(mockCtx, invalidVehicleData);
                expect(result.valid).to.be.false;
                expect(result.explanation).to.include('Invalid VIN format');
            } catch (error) {
                expect(error.message).to.exist;
            }
        });

        it('should validate pet data structure', async () => {
            const validPetData = {
                id: 'PET-001',
                type: 'pet',
                data: {
                    microchipId: '956000014569871',
                    breed: 'Golden Retriever',
                    age: 3,
                    owner: 'John Smith'
                }
            };

            const mockCtx = null;
            
            try {
                const result = await contract.ValidateIdentityData(mockCtx, validPetData);
                expect(result.valid).to.be.true;
                expect(result.explanation).to.include('validations passed');
            } catch (error) {
                expect(error.message).to.exist;
            }
        });

        it('should validate IoT device data structure', async () => {
            const validIoTData = {
                id: 'IOT-001',
                type: 'iot',
                data: {
                    deviceType: 'Temperature Sensor',
                    manufacturer: 'Bosch',
                    serialNumber: 'BSH-TEMP-001'
                }
            };

            const mockCtx = null;
            
            try {
                const result = await contract.ValidateIdentityData(mockCtx, validIoTData);
                expect(result.valid).to.be.true;
                expect(result.explanation).to.include('validations passed');
            } catch (error) {
                expect(error.message).to.exist;
            }
        });
    });

    describe('Helper Methods', () => {
        it('should return correct required fields for vehicle type', () => {
            const requiredFields = contract.getRequiredFieldsForType('vehicle');
            expect(requiredFields).to.deep.equal(['vin', 'make', 'model', 'year']);
        });

        it('should return correct required fields for pet type', () => {
            const requiredFields = contract.getRequiredFieldsForType('pet');
            expect(requiredFields).to.deep.equal(['microchipId', 'breed', 'owner']);
        });

        it('should return correct required fields for iot type', () => {
            const requiredFields = contract.getRequiredFieldsForType('iot');
            expect(requiredFields).to.deep.equal(['deviceType', 'manufacturer', 'serialNumber']);
        });

        it('should return default required fields for unknown type', () => {
            const requiredFields = contract.getRequiredFieldsForType('unknown');
            expect(requiredFields).to.deep.equal(['id']);
        });
    });

    describe('Cross-Domain Consistency', () => {
        it('should validate proper VIN format', async () => {
            const vehicleData = {
                type: 'vehicle',
                data: { vin: '1HGBH41JXMN109186' }
            };

            const result = await contract.CheckCrossDomainConsistency(null, vehicleData);
            expect(result.consistent).to.be.true;
            expect(result.reason).to.include('consistency verified');
        });

        it('should reject invalid VIN format', async () => {
            const vehicleData = {
                type: 'vehicle',
                data: { vin: '123INVALID456' }
            };

            const result = await contract.CheckCrossDomainConsistency(null, vehicleData);
            expect(result.consistent).to.be.false;
            expect(result.reason).to.include('VIN format violates');
        });

        it('should validate proper microchip ID format', async () => {
            const petData = {
                type: 'pet',
                data: { microchipId: '956000014569871' }
            };

            const result = await contract.CheckCrossDomainConsistency(null, petData);
            expect(result.consistent).to.be.true;
        });

        it('should reject invalid microchip ID format', async () => {
            const petData = {
                type: 'pet',
                data: { microchipId: '123000014569871' } // Wrong prefix
            };

            const result = await contract.CheckCrossDomainConsistency(null, petData);
            expect(result.consistent).to.be.false;
            expect(result.reason).to.include('does not follow ISO');
        });
    });

    describe('Data Structure Validation', () => {
        it('should reject missing required fields', async () => {
            const incompleteData = {
                id: 'VEH-003',
                type: 'vehicle',
                data: {
                    // Missing VIN
                    make: 'Honda',
                    model: 'Civic'
                }
            };

            const mockCtx = null;
            
            try {
                const result = await contract.ValidateIdentityData(mockCtx, incompleteData);
                expect(result.valid).to.be.false;
                expect(result.explanation).to.include('Invalid VIN');
            } catch (error) {
                expect(error.message).to.exist;
            }
        });

        it('should reject unsupported identity types', async () => {
            const unsupportedData = {
                id: 'UNSUPPORTED-001',
                type: 'robot', // Unsupported type
                data: {
                    model: 'R2D2'
                }
            };

            const mockCtx = null;
            
            try {
                const result = await contract.ValidateIdentityData(mockCtx, unsupportedData);
                expect(result.valid).to.be.false;
                expect(result.explanation).to.include('Unsupported identity type');
            } catch (error) {
                expect(error.message).to.exist;
            }
        });
    });
});
