# Strategy Execution Core
Strategy Execution Core is a Node js server for execution tradingview-adapter calls on the exchanges.
## Installation
```bash
npm i
```
## Usage
- Create your own .env using .env.example as template.


Data schema from tradingview-adapter server 
JSON:

{ 
Ticker: 'ETHUSDT', 
Price: ' 242.26',
Time: '2020-06-09T20:02:00Z',
Strategy: 'rwi',
Action: 'buy' || 'sell' ,
Mode:'development' || 'master'
}


