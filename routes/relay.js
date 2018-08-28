const express = require('express');

const router = express.Router();

const responseJson = {
  relayNo: '',
  actionSuccess: true,
  isOn: true,
};


router.post('/', (req, res) => {
  responseJson.relayNo = req.body.switch;
  responseJson.isOn = !responseJson.isOn;

  console.log(`relay no. ${req.body.switch} was toggled to a new value of : "${responseJson.isOn}"`);

  res.send(responseJson);
});

module.exports = router;
