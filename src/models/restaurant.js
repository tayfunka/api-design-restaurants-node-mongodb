const mongoose = require('mongoose');
const { Schema } = mongoose;

const restaurantSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        required: true,
    },
    address: {
        city: {
            type: String,
            required: true,
        },
        district: {
            type: String,
            required: true,
        },
        fullAddress: {
            type: String,
            required: true,
        },
    },
    location: {
        type: { type: String, default: 'Point' },
        coordinates: [Number],
    },
    branches: [
        {
            address: {
                city: String,
                district: String,
                fullAddress: String,
            },
            location: {
                type: { type: String, default: 'Point' },
                coordinates: [Number],
            },
        },
    ],
    menu: [
        {
            name: String,
            price: Number,
            content: String,
        },
    ],
    types: {
        type: [String],
        required: true,
    },
    score: {
        type: Number,
    },
});
restaurantSchema.index({ location: '2dsphere' });

const Restaurant = mongoose.model('Restaurant', restaurantSchema);

module.exports = Restaurant;