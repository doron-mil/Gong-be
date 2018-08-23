const mocha = require('mocha');
const chai = require('chai');
const sinonChai = require('sinon-chai');

chai.use(sinonChai);

global.mocha = mocha;
global.expect = chai.expect;
