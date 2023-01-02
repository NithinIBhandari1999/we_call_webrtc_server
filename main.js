import express from 'express';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import http from 'http';

import envKeys from './src/config/envKeys.js';

import socketInit from './src/config/socket.js';

let PORT = 8080;
if (envKeys.CUSTOM_ENV === 'prod') {
    PORT = process.env.PORT;
}

const app = express();

const server = http.createServer(app);

const io = socketInit(server);

app.use(cookieParser());

app.use(bodyParser.json());

app.use(function (req, res, next) {

    let origin = req.get('origin');

    if (!origin) {
        origin = envKeys.BACKEND_URL;
    }

    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', origin);

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
});

app.get('/', async (req, res) => {
    try {
        const token = '12345';

        res.cookie('jwtValue', token, { maxAge: 9000000000, httpOnly: true, secure: true });

        await io.on('connection', (socket) => {
            console.log(socket);

            const payload = { message: 'Test', user: { id: 'foOO' } };
            io.emit('call', payload);
        });

        return res.send('Learn Socket io');

    } catch (error) {
        console.error(error);
        return res.send('Learn Error Socket io');
    }
});

server.listen(PORT, () => {
    console.log(`Listen on port http://localhost:${PORT}`);
});
