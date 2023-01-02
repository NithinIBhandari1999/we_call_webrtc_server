import mongodbConnection from '../../config/dbCreateConnection.js';

import { Schema } from 'mongoose';


const videoCallSchema = new Schema(
    {
        roomId: {
            type: String,
            trim: true,
            default: '',
        },

        deviceId: {
            type: String,
            trim: true,
            default: '',
        },

        socketId: {
            type: String,
            trim: true,
            default: '',
        },

    },
    {
        collection: 'VideoCall',
        timestamps: true,
    }
);

const modelVideoCall = mongodbConnection.model('VideoCall', videoCallSchema);

export default modelVideoCall;