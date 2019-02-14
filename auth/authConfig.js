const uuidv4 = require('uuid/v4');

const userMap = new Map();

userMap.set('admin', {
  id: 'admin',
  role: 'admin',
  encodedPasswd: '$2b$10$cKrQsB7rlnAvyZ1xwv5p9uZDgleSgwxd/ZG1pCBRogMc51S7VC/DC',
  tokenSecret: uuidv4(),
});

userMap.set('teacher', {
  id: 'teacher',
  role: 'teacher',
  encodedPasswd: '$2b$10$2eBTa58CBtn/PiK8WBllvOmToRzVPkUXAXlLLC4KdwzOT9puYymba',
  tokenSecret: uuidv4(),
});

module.exports = userMap;
