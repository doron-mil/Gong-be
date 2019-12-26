const express = require('express');
const relaysModule = require('../relay');
const relayAndSoundManager = require('../lib/relayAndSoundManager');
const responder = require('../lib/responder');

const router = express.Router();

const responseJson = {
  relayNo: '',
  actionSuccess: true,
  isOn: true,
};

router.post('/playGong', (req, res) => {
  relayAndSoundManager.playImmediateGong(req.body)
    .then(() => responder.send200Response(res, { gongSuccessPlay: true }))
    .catch((err) => responder.sendErrorResponse(res,
      err.httpStatusCode || 500, 'Failed to play gong ', err));
});

router.post('/toggleSwitch', (req, res) => {
  responseJson.relayNo = req.body.switch;

  const relayStatusVal = relaysModule.toggleRelay(responseJson.relayNo);

  responseJson.isOn = relayStatusVal;

  // eslint-disable-next-line max-len
  // console.log(`relay no. ${req.body.switch} was toggled to a new value of : "${responseJson.isOn}"`);

  res.send(responseJson);
});

router.post('/setAll', (req, res) => {
  const isOn = req.body.value;

  const relayStatusVal = relaysModule.setRelayAll(isOn);

  responseJson.isOn = relayStatusVal;

  // eslint-disable-next-line max-len
  // console.log(`relay no. ${req.body.switch} was toggled to a new value of : "${responseJson.isOn}"`);

  res.send(responseJson);
});

module.exports = router;
