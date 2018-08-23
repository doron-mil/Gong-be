const sinon = require('sinon');
const responder = require('../../../lib/responder');

describe('responder', () => {
    let res;

    beforeEach(() => {
        res = {
            json: sinon.spy(),
            status: sinon.stub().returnsThis(),
        };
    });

    describe('send200Response', () => {
        it('calls res.json with a json object with ok set to true and data set to data', () => {
            const data = { testData: 'test data' };
            const expectedJSON = {
                ok: true,
                data,
            };
            responder.send200Response(res, data);
            expect(res.json).to.have.been.calledOnce;
            expect(res.json).to.have.been.calledWith(expectedJSON);
        });
    });
    describe('sendErrorResponse', () => {
        it('calls res.json with an object with ok set to false and error set to err.userSafeMessage', () => {
            const message = 'test 404 error';
            const status = 404;
            const expectedJSON = {
                ok: false,
                error: message,
                data: null,
            };
            responder.sendErrorResponse(res, status, message);
            expect(res.status).to.have.been.calledOnce;
            expect(res.status).to.have.been.calledWith(status);
            expect(res.json).to.have.been.calledOnce;
            expect(res.json).to.have.been.calledWith(expectedJSON);
        });
    });
});
