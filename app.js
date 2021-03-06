require('dotenv').config();

const http = require('http');
const router = require('./routes/api');

// const Binance = require('node-binance-api');
// const binance = new Binance().options({
//   APIKEY: process.env.APIKEY,
//   APISECRET:  process.env.APISECRET
// });

//check connection to binance 
// binance.futuresBalance().then( (data) => {
//   console.info(data);
// });

const port = process.env.PORT || 4040;
const ipAddress = process.env.IP_ADDRESS;

const handleHttpServerErrors = require('./utils/handleHttpServerErrors');
// const TradingViewAlert = require("./serializers/TradingViewAlert");
const BinanceRequestProvider = require('./serializers/BinanceRequestProvider');

var express = require('express'),
    app     = express();

app.set('port', port);
app.set('ipaddr',ipAddress);

var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

const server = http.createServer(app);

server.listen(port, () => {
  console.log(`RWI strategy started on:\nip -> ${process.env.IP_ADDRESS}\nport -> ${server.address().port}`);
});

server.on('error', handleHttpServerErrors);

app.use('/', router);

app.use((req, res, next) => {
    const err = new Error('Not Found');
    err.status = 404;
    next(err);
});