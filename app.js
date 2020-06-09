require('dotenv').config();


const port = process.env.PORT || 4040;
const ipAddress = process.env.IP_ADDRESS;
const http = require('http');
const handleHttpServerErrors = require('./utils/handleHttpServerErrors');
const TradingViewAlert = require("./serializers/TradingViewAlert");

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


app.post('/alert_data', function (req, res) {
    const {Ticker, Price, Time, Strategy, Action} = req.body;

    const alert = new TradingViewAlert(Ticker, Price, Time, Strategy, Action);
    
    res.send(alert);
});

app.use((req, res, next) => {
    const err = new Error('Not Found');
    err.status = 404;
    next(err);
});

app.use((error, req, res, next) => {
    res.status(error.status || 500);
    res.json({
        error: error.message,
        description: (app.get('env') === 'development') ? error : {}
    });
});
