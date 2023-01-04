import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/mongo-adapter';
import { MongoClient } from 'mongodb';

import envKeys from './envKeys.js';

import constantSocketActions from '../constant/constantSocket/constantSocketActions.js';

import modelVideoCall from '../model/User/modelVideoCall.js';

const DB = 'dbDevWeCall';
const COLLECTION = 'socket_io_adapter_events';

const mongoClient = new MongoClient(envKeys.mongoURI, {
    useUnifiedTopology: true,
});

const emitToRoomByRoomId = async ({
    io,
    roomId
}) => {
    try {
        let resultAll = await modelVideoCall.aggregate([
            {
                $match: {
                    roomId
                }
            },
            {
                $sort: {
                    deviceId: -1
                }
            }
        ]);

        // let tempRoomInfo = roomList[roomId];
        let brodcastRoomId = resultAll.map((user) => {
            return user.socketId;
        });

        if (brodcastRoomId.length > 0) {
            io
                .to(brodcastRoomId)
                .emit(constantSocketActions.CLIENT_ROOM_JOINED_BRODCAST, {
                    userList: resultAll
                });
        }

    } catch (error) {
        console.error(error);
    }
};

const addToRoom = async ({
    io,
    roomId,
    socketId,
    deviceId
}) => {
    try {
        await modelVideoCall.create({
            roomId,
            deviceId: `${deviceId}`,
            socketId
        });

        // emit to all users
        emitToRoomByRoomId({
            io,
            roomId
        });
    } catch (error) {
        console.error(error);
    }
};

const removeFromRoomByUserId = async ({
    io,
    roomId,
    deviceId
}) => {
    try {
        let resultDelete = await modelVideoCall.deleteOne({
            roomId,
            deviceId
        });

        if (resultDelete.deletedCount > 0) {
            emitToRoomByRoomId({
                io,
                roomId
            });
        }
    } catch (error) {
        console.error(error);
    }
};

const removeBySocketId = async ({
    io,
    socketId,
}) => {

    try {
        let resultAll = await modelVideoCall.find({
            socketId,
        });

        for (let index = 0; index < resultAll.length; index++) {
            const element = resultAll[index];
            removeFromRoomByUserId({
                io,
                roomId: element.roomId,
                deviceId: element.deviceId
            });
        }
    } catch (error) {
        console.error(error);
    }
};

const init = async (server) => {
    try {
        await mongoClient.connect();

        try {
            await mongoClient.db(DB).createCollection(COLLECTION, {
                capped: true,
                size: 1e6
            });
        } catch (e) {
            // collection already exists
        }

        const mongoCollection = mongoClient.db(DB).collection(COLLECTION);

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

        io.adapter(createAdapter(mongoCollection));

        io.on('connection', (socket) => {
            const socketId = socket.id;

            console.log({
                socketId
            });

            socket.on(constantSocketActions.SERVER_ROOM_JOINED, (payload) => {
                try {
                    let roomId = payload.roomId;
                    let deviceId = payload.deviceId;

                    addToRoom({
                        io,
                        roomId,
                        socketId: socketId,
                        deviceId: deviceId
                    });
                } catch (error) {
                    console.error(error);
                }
            });

            socket.on(constantSocketActions.REQUEST_OFFER, (payload) => {
                try {
                    console.log('TYPE: ', constantSocketActions.REQUEST_OFFER);
                    console.log('payload: ', payload);



                    let sendSocketId = payload.socketIdRemote;

                    io.to(sendSocketId).emit(
                        constantSocketActions.REQUEST_OFFER,
                        { ...payload }
                    );

                } catch (error) {
                    console.error(error);
                }
            });

            socket.on(constantSocketActions.SEND_OFFER, (payload) => {
                try {
                    console.log('TYPE: ', constantSocketActions.SEND_OFFER);
                    console.log('payload: ', payload);

                    let sendSocketId = payload.socketIdLocal;

                    io.to(sendSocketId).emit(constantSocketActions.SEND_OFFER, { ...payload });

                } catch (error) {
                    console.error(error);
                }
            });

            socket.on(constantSocketActions.SEND_ANSWER, (payload) => {
                // TODO refactor
                try {
                    console.log('TYPE: ', constantSocketActions.SEND_ANSWER);
                    // console.log(payload);

                    let sendSocketId = payload.socketIdRemote;

                    io.to(sendSocketId).emit(constantSocketActions.SEND_ANSWER, { ...payload });
                } catch (error) {
                    console.error(error);
                }
            });

            socket.on('disconnect', () => {
                try {
                    // desc - when disconnected, remove all session

                    removeBySocketId({
                        io,
                        socketId
                    });
                } catch (error) {
                    console.error(error);
                }

            });

        });

        return io;
    } catch (error) {
        console.error(error);
    }
};

export default init;