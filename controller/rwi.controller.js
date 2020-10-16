const validateData = require("../serializers/TradingViewAlert");
const makeDealHelperClass = require('../utils/makeDealHelper');

const accounts = require('../accounts/accounts');

//console.log('---------available accounts-----------');
//console.log(accounts);
//console.log('---------available accounts-----------');

class RwiController {
    async makeDeal(req, res, next) {
        //Only local applications should contact this server
        if (!req.headers.host.includes('localhost') && !req.headers.host.includes('127.0.0.1')) return res.status(400).send({ error: 'Bad host' });

        //console.log('---------req.body-----------');
        //console.log(req.body);
        //console.log('---------req.body-----------');

        const adapterData = new validateData(req.body.Ticker, req.body.Price, req.body.Time, req.body.Strategy, req.body.Action);

        //console.log('---------adapterData-----------');
        //console.log(adapterData);
        //console.log('---------adapterData-----------');


        let deposit = process.env.ORDER_SIZE;

        // Array for saving logs for all accounts
        const dealsResult = [];
        
        const dealPromises = [];

        for (let i = 0; i < accounts.length; i++) {
            let makeDealHelper = new makeDealHelperClass(adapterData, deposit);
            dealPromises.push(new Promise(async (resolve, reject) => {
                try {
                    //console.log('--------account--------');
                    //console.log(accounts[i]);
                    //console.log('--------account--------');

                    await makeDealHelper.build(accounts[i]);

                    resolve(makeDealHelper.manageDeals());
                } catch (err) {
                    await dealsResult.push({ user: { id: accounts[i].id, name: accounts[i].name }, err });
                    reject(err);
                }
            }));
        }

        //  Execute all dealPromises here
        Promise.allSettled(dealPromises).then(results => {
            console.log(results);
            return res.status(200).send({ end: 'end' });
           });
    }
}


module.exports = new RwiController();