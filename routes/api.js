var express = require('express');
var router = express.Router();

const rwiController = require('../controller/rwi.controller');

// *** Adapter Routes *** /

router.post('/alert_data', (req, res, next) => rwiController.makeDeal(req, res, next));

module.exports = router;