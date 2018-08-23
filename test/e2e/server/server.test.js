const request = require('supertest');
const app = require('../../../server/app');

describe('server', () => {
  it('GET /doesnotexist responds with 404', (done) => {
    request(app)
        .get('/doesnotexist')
        .expect(404)
        .expect((res) => {
          expect(res.body.ok).to.be.false;
          expect(res.body.error).to.equal('resource not found');
        })
        .end(done);
  }).timeout(4000);
});
