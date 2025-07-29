const { WebSocketServer } = require('ws');
const session = require('express-session');
const express = require('express');
const http = require('http');
const bodyParser = require('body-parser');
const app = express();

const sessionParser = session({
    saveUninitialized: false,
    secret: 'N0_$eCuRiTy',
    resave: false
});

app.use(express.static('public'));
app.use(sessionParser);
app.use(bodyParser.urlencoded({ extended: true }));
app.post('/login', function (req, res) {
    //
    // "Log in" user and set userId to session.
    //
    req.session.name = req.body.name;
    req.session.game = req.body.game;
    res.redirect("/game")
});

const server = http.createServer(app);


const wss = new WebSocketServer({ noServer: true });

wss.on('connection', function connection(ws, request) {
    const game = require("./games/" + request.session.game + ".js")
    ws.send(game.initialize(request.session))
    ws.on('message', function message(data, isBinary) {
        let response = game.parse(data, request.session)
        wss.clients.forEach(function each(client) {
            if (client.readyState === WebSocket.OPEN) {
                client.send(`<br>` + request.session.name + ": " + data + response, { binary: isBinary });
            }
        });
    });
    ws.on('error', console.error);
});


server.on('upgrade', function upgrade(request, socket, head) {

    sessionParser(request, {}, () => {
        if (!request.session.name || !request.session.game) {
            socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
            socket.destroy();
            return;
        }

        try{
            const game = require("./games/" + request.session.game + ".js")
        }catch(ex) {
            console.log(ex)
            console.log("Unrecognized game")
            socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
            socket.destroy();
            return
        }

        const { pathname } = new URL(request.url, 'wss://base.url');
        if (pathname === '/game/ws') {
            wss.handleUpgrade(request, socket, head, function done(ws) {
                wss.emit('connection', ws, request);
            });
        } else {
            socket.destroy();
        }
    })
});

server.listen(8080, "172.27.69.32");