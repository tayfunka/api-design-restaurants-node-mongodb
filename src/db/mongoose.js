const mongoose = require('mongoose');
const { Schema } = mongoose

mongoose.connect('mongodb://127.0.0.1:27017/voco-case-api'), {
    userNewUrlParser: true,
    useCreateIndex: true,
};