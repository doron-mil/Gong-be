const sinon = require('sinon');
const notFoundHandler = require('../../../../routes/handlers/notFoundHandler');

describe('notFoundHandler', () => {
    let nextStub;
    let req;
    let res;

    beforeEach(() => {
        req = {};
        res = {};
        nextStub = sinon.stub();
    });

    it('calls next with an error', () => {
        notFoundHandler(req, res, nextStub);
        expect(nextStub).to.have.been.calledOnce;
        expect(nextStub.args[0][0]).to.be.an.instanceOf(Error);
    });

    it('sets error.httpStatusCode to 404', () => {
        notFoundHandler(req, res, nextStub);
        expect(nextStub).to.have.been.calledOnce;
        expect(nextStub.args[0][0].httpStatusCode).to.equal(404);
    });

    it('sets error.userSafeMessage to "resource not found"', () => {
        notFoundHandler(req, res, nextStub);
        expect(nextStub).to.have.been.calledOnce;
        expect(nextStub.args[0][0].userSafeMessage).to.equal('resource not found');
    });
});
