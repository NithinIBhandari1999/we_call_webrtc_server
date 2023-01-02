import mongoose from 'mongoose';

import envKeys from './envKeys.js';

let db = envKeys.mongoURI;

const conn = mongoose.createConnection(db);

export default conn;