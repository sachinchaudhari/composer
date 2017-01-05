/*
 * IBM Confidential
 * OCO Source Materials
 * IBM Concerto - Blockchain Solution Framework
 * Copyright IBM Corp. 2016
 * The source code for this program is not published or otherwise
 * divested of its trade secrets, irrespective of what has
 * been deposited with the U.S. Copyright Office.
 */

'use strict';

const ConnectionProfileManager = require('../lib/connectionprofilemanager');
const ConnectionProfileStore = require('../lib/connectionprofilestore');
const ConnectionManager = require('../lib/connectionmanager');
const Connection = require('../lib/connection');

const chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));
chai.use(require('chai-things'));
const mockery = require('mockery');
const sinon = require('sinon');

describe('ConnectionProfileManager', () => {

    beforeEach(() => {
        mockery.enable();
    });

    afterEach(() => {
        mockery.deregisterAll();
    });

    describe('#construct', () => {

        it('should throw if no connection profile store', () => {

            (() => {
                let cpm = new ConnectionProfileManager(null);
                cpm.should.be.null;
            }).should.throw(/Must create ConnectionProfileManager/);
        });

        it('should be able to get connection profile store', () => {
            const store = sinon.createStubInstance(ConnectionProfileStore);
            let cpm = new ConnectionProfileManager(store);
            cpm.should.not.be.null;
            cpm.getConnectionProfileStore().should.deep.equal(store);
        });
    });

    describe('#addConnectionManager', () => {

        it('should be able to set then get connection manager associated with a type', () => {
            const store = sinon.createStubInstance(ConnectionProfileStore);
            const profile = {type: 'foo', data : 'data'};
            store.load.returns( Promise.resolve(profile) );
            const connectionManager = sinon.createStubInstance(ConnectionManager);
            let cpm = new ConnectionProfileManager(store);
            cpm.should.not.be.null;
            cpm.addConnectionManager( 'foo', connectionManager);
            return cpm.getConnectionManager( 'baz' )
            .then((result) => {
                result.should.equal(connectionManager);
            });
        });
    });

    describe('#getConnectionManager', () => {

        it('should throw if no connection manager available', () => {
            const store = sinon.createStubInstance(ConnectionProfileStore);
            const profile = {type: 'foo', data : 'data'};
            store.load.returns( Promise.resolve(profile) );
            let cpm = new ConnectionProfileManager(store);
            cpm.should.not.be.null;
            return cpm.getConnectionManager( 'baz' ).should.be.rejectedWith(/Failed to load connector module/);
        });

        it('should dynamically load the connection manager', () => {
            /** test class */
            class TestConnectionManager extends ConnectionManager { }
            mockery.registerMock('@ibm/ibm-concerto-connector-foo', TestConnectionManager);
            const store = sinon.createStubInstance(ConnectionProfileStore);
            const profile = {type: 'foo', data : 'data'};
            store.load.returns( Promise.resolve(profile) );
            let cpm = new ConnectionProfileManager(store);
            cpm.should.not.be.null;
            return cpm.getConnectionManager( 'baz' ).should.eventually.be.an.instanceOf(TestConnectionManager);
        });

        it('should use a registered connection manager', () => {
            /** test class */
            class TestConnectionManager extends ConnectionManager { }
            ConnectionProfileManager.registerConnectionManager('foo', TestConnectionManager);
            const store = sinon.createStubInstance(ConnectionProfileStore);
            const profile = {type: 'foo', data : 'data'};
            store.load.returns( Promise.resolve(profile) );
            let cpm = new ConnectionProfileManager(store);
            cpm.should.not.be.null;
            return cpm.getConnectionManager( 'baz' ).should.eventually.be.an.instanceOf(TestConnectionManager);
        });

    });

    describe('#connect', () => {

        it('should call connect on connection manager', () => {
            const store = sinon.createStubInstance(ConnectionProfileStore);
            const profile = {type: 'foo', data : 'data'};
            store.load.returns( Promise.resolve(profile) );
            const connectionManager = sinon.createStubInstance(ConnectionManager);
            const stubConnection = sinon.createStubInstance(Connection);
            connectionManager.connect.returns(stubConnection);
            let cpm = new ConnectionProfileManager(store);
            cpm.should.not.be.null;
            cpm.addConnectionManager( 'foo', connectionManager);
            return cpm.connect( 'foo', 'myNetwork' )
            .then((connection) => {
                connection.should.equal(stubConnection);
            });
        });
    });


    describe('#toJSON', () => {

        it('should not be able to serialize', () => {
            const store = sinon.createStubInstance(ConnectionProfileStore);
            let cpm = new ConnectionProfileManager(store);
            cpm.should.not.be.null;
            cpm.toJSON().should.deep.equal({});
        });
    });

});