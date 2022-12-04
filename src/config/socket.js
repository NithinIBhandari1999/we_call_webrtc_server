import { Server } from 'socket.io';

import envKeys from './envKeys.js';

import constantSocketActions from '../constant/constantSocket/constantSocketActions.js';

const userList = {};

const init = (server) => {
    try {
        let allowedDomains = [
            'http://localhost:3000',
            'localhost:3000'
        ];

        if (envKeys.CUSTOM_ENV === 'prod') {
            allowedDomains.push(envKeys.FRONTEND_URL);
            allowedDomains.push(`https://${envKeys.FRONTEND_URL}`);
        }

        const io = new Server(server, {
            cors: {
                origin: allowedDomains,
                allowedHeaders: ['Set-Cookie'],
                credentials: true
            }
        });

        io.on('connection', (socket) => {
            const socketId = socket.id;

            console.log({
                socketId
            });

            userList[String(socketId)] = {};

            socket.on(constantSocketActions.ROOM_JOINED, (payload) => {
                try {
                    console.log('TYPE: ', constantSocketActions.ROOM_JOINED);
                    let roomId = payload.roomId;

                    socket.join(roomId);
                    
                    io
                        .to(roomId)
                        .emit(constantSocketActions.ROOM_JOINED, {
                            ...payload,
                            socketId
                        });
                } catch (error) {
                    console.error(error);
                }
            });

            socket.on(constantSocketActions.OFFER, (payload) => {
                try {
                    console.log('TYPE: ', constantSocketActions.OFFER);

                    let roomId = payload.roomId;

                    io.to(roomId).except([socketId]).emit(constantSocketActions.OFFER, { ...payload, socketId });

                } catch (error) {
                    console.error(error);
                }
            });

            socket.on(constantSocketActions.ANSWER, (payload) => {
                try {
                    console.log('TYPE: ', constantSocketActions.ANSWER);

                    let roomId = payload.roomId;

                    io.to(roomId).except([socketId]).emit(constantSocketActions.ANSWER, { ...payload, socketId });
                } catch (error) {
                    console.error(error);
                }
            });

            socket.on('disconnected', () => {
                delete userList[socketId];
            });

        });

        return io;
    } catch (error) {
        console.error(error);
    }
};

export default init;