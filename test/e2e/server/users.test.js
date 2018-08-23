const request = require('supertest');
const app = require('../../../server/app');

describe('users', () => {
  it('GET /users responds with 200 and users', (done) => {
    request(app)
      .get('/users')
      .expect(200)
      .expect((res) => {
        expect(res.body.ok).to.be.true;
        expect(Array.isArray(res.body.data)).to.equal(true);
      })
      .end(done);
  }).timeout(4000);

  it('GET /users/:id responds with 200', (done) => {
    const id = '1';
    request(app)
      .get(`/users/${id}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.ok).to.be.true;
        expect(res.body.data.id).to.equal(id);
      })
      .end(done);
  }).timeout(4000);
});
