const express = require('express');
const RelaysModule = require('../relay');

const router = express.Router();

const responseJson = {
  relayNo: '',
  actionSuccess: true,
  isOn: true,
};

const relaysModule = new RelaysModule();

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
