const uuidv4 = require('uuid/v4');

const userMap = new Map();

userMap.set('admin', {
  id: 'admin',
  role: 'admin',
  encodedPasswd: '$2b$10$h0AsIntabWZMLBnAfX.uI.bHilU3VHweXCcQMNsMquY.ZXQScB.Ly',
  tokenSecret: uuidv4(),
});

userMap.set('teacher', {
  id: 'teacher',
  role: 'super-user',
  encodedPasswd: '$2b$10$Jd3i1EvN4qJxyC219cF/peK.NiYU1jWEh5laGvG/d.haoN8qbMOuW',
  tokenSecret: uuidv4(),
});

userMap.set('dw', {
  id: 'dw',
  role: 'user',
  encodedPasswd: '$2b$10$BRP2/YfY0Ug1pGU8vE1Ip.P.yRfcw/JaN4TzNBeGxzg7YDLcRhnP6',
  tokenSecret: uuidv4(),
});

module.exports = userMap;
