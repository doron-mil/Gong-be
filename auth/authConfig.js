const uuidv4 = require('uuid/v4');

const userMap = new Map();

userMap.set('dev', {
  id: 'dev',
  role: 'dev',
  encodedPasswd: '$2b$10$b8CZ//81swBg3S78um/IZu6lHu6C2KQxOCgnZXRsy/E5fI.pxFYt2',
  tokenSecret: uuidv4(),
});

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
