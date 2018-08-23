const sinon = require('sinon');
const proxyquire = require('proxyquire');

describe('errorHandler', () => {
    let responderStub;
    let loggerStub;
    let errorHandler;
    let sendErrorResponse;

    beforeEach(() => {
        loggerStub = {
            log: sinon.spy(),
        };

        responderStub = {
            sendErrorResponse: sinon.spy(),
        };

        errorHandler = proxyquire('../../../../routes/handlers/errorHandler', {
            '../../lib/logger': loggerStub,
            '../../lib/responder': responderStub,
        });

        sendErrorResponse = responderStub.sendErrorResponse;
    });

    it('calls sendErrorResponse with correct status and message if err.status is 404', () => {
        const req = {};
        const res = {};
        const err = new Error('');
        err.httpStatusCode = 400;
        err.userSafeMessage = 'user safe message';

        errorHandler(err, req, res);
        expect(sendErrorResponse).to.have.been.calledOnce;
        expect(sendErrorResponse).to.have.been.calledWith(res, err.httpStatusCode, err.userSafeMessage);
    });

    it('calls sendErrorResponse with httpStatusCode and "server error" if userSafeMessage does not exist', () => {
        const req = {};
        const res = {};
        const err = new Error('');
        err.httpStatusCode = 400;

        errorHandler(err, req, res);
        expect(sendErrorResponse).to.have.been.calledOnce;
        expect(sendErrorResponse).to.have.been.calledWith(res, err.httpStatusCode, 'server error');
    });

    it('calls sendErrorResponse with 500 and "server error" if err.httpStatusCode is undefined', () => {
        const req = {};
        const res = {};
        const err = new Error('');

        errorHandler(err, req, res);
        expect(sendErrorResponse).to.have.been.calledOnce;
        expect(sendErrorResponse).to.have.been.calledWith(res, 500, 'server error');
    });

    it('calls winston.log with level set to error if httpStatusCode is 500', () => {
        const message = 'error message to log';
        const req = {};
        const res = {};
        const err = new Error(message);

        errorHandler(err, req, res);
        expect(loggerStub.log).to.have.been.calledOnce;
        expect(loggerStub.log).to.have.been.calledWith('error', message);
    });

    it('calls winston.log with level set to verbose if httpStatusCode is not 500', () => {
        const message = 'error message to log';
        const req = {};
        const res = {};
        const err = new Error(message);
        err.httpStatusCode = 403;

        errorHandler(err, req, res);
        expect(loggerStub.log).to.have.been.calledOnce;
        expect(loggerStub.log).to.have.been.calledWith('verbose', message);
    });
});
