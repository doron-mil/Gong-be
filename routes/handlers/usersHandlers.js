const responder = require('../../lib/responder');

const users = [
  { id: '1', firstName: 'Edd', secondName: 'Yerburgh' },
  { id: '2', firstName: 'Colonel', secondName: 'Mustard' },
];

function getUsers(req, res, next) {
  responder.send200Response(res, users);
}

function getUsersId(req, res, next) {
  const id = req.params.id;
  responder.send200Response(res, users.filter(user => user.id === id)[0]);
}

module.exports = {
  getUsers,
  getUsersId,
};
