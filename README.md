dice-roller
========

A simple, customizable dice roller (and technically other things) built basically as just a websocket with per-game hooks for parsing commands.

## Why
Because most VTTs are extremely heavyweight, and don't really support bespoke systems very well. They may support custom dice commands, but extending those is a chore. All I want is something that allows me to roll dice (and maybe eventually draw cards), in a way that everyone playing can see, that is easily extensible to new games, and lets me customize it for ease of use. 

## How
Extensions are pretty straightforward; supporting a new game system requires - 
- Adding a new module in `games`. It should have an `initialize` function that returns the commands you plan to support, and a `parse` function that actually parses those commands. See `games/outgunned_adventure.js` as an example. 
- Adding a new entry in `public/index.html` for the game. The option tag's value should be the same as the JS filename, sans extension.

Running should be just `npm install` followed by `node index.js`. Right now it's hardcoded to run on 8080 sans encryption. Modifying to support encryption should be straightforward enough, I just am not bothering to set up a DNS entry and cert (or bypass browser warnings that it's not a trusted cert), since nothing is secret and this isn't exactly a high value target. There also isn't any allowlist functionality yet; that plus admin would be a bit of future effort possibly.

Lastly, the way this is set up assumes a single game at a time, since there is only a single websocket server running at a time. People _could_ do something silly like join and select different games (once supported), so everyone has different commands, but that isn't something I'm likely to care about. Running multiple servers would also mean I'd need to think about lifecycle of a server, and this is just a little service for me to run with my gaming group when we try new stuff.
