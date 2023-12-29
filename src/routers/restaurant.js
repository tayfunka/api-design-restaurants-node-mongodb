const express = require('express');
const Restaurant = require('../models/restaurant');
const router = new express.Router();

// Create a restaurant
router.post('/restaurants', async (req, res) => {
    try {
        const { name, description, address, location, branches, menu, types } = req.body;

        // Validate required fields
        if (!name || !description || !address || !location || !menu || !types) {
            return res.status(400).send({ error: 'Missing required fields' });
        }

        // Create a new restaurant
        const restaurant = new Restaurant({
            name,
            description,
            address,
            location,
            branches: branches || [], // Optional branches
            menu, // Assuming menu is an array of menu items
            types, // Assuming types is an array of restaurant types
        });

        // Save the restaurant
        await restaurant.save();

        res.status(201).send(restaurant);
    } catch (error) {
        res.status(400).send(error);
    }
});

// Add menu
router.post('/restaurants/add-menu/:restaurantId', async (req, res) => {
    try {
        const restaurantId = req.params.restaurantId;
        const { newMenus } = req.body;

        // Check if the restaurant exists
        const restaurant = await Restaurant.findById(restaurantId);
        if (!restaurant) {
            return res.status(404).send({ error: 'Restaurant not found' });
        }

        // Add the new menus to the restaurant's menu
        restaurant.menu = restaurant.menu.concat(newMenus);

        // Save the updated restaurant
        await restaurant.save();

        res.status(201).send({ message: 'New menus added to the restaurant', restaurant });
    } catch (error) {
        res.status(400).send({ error: 'Unable to add new menus' });
    }
});

// Get all restaurants
router.get('/restaurants', async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;

        const parsedPage = parseInt(page);
        const parsedLimit = parseInt(limit);

        const skip = (parsedPage - 1) * parsedLimit;

        const restaurants = await Restaurant.find()
            .skip(skip)
            .limit(parsedLimit);

        res.send({ restaurants, page: parsedPage, limit: parsedLimit });
    } catch (error) {
        res.status(500).send({ error: 'Unable to retrieve restaurants' });
    }
});


// List the 5 closest restaurants with 'lahmacun'
router.get('/restaurants/nearby/:latitude/:longitude', async (req, res) => {
    try {
        const { latitude, longitude } = req.params;

        // Convert latitude and longitude to numbers
        const parsedLatitude = parseFloat(latitude);
        const parsedLongitude = parseFloat(longitude);

        // Find the 5 closest restaurants based on location and description
        const restaurants = await Restaurant.find({
            location: {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [parsedLongitude, parsedLatitude],
                    },
                },
            },
            description: { $regex: /lahmacun/i },
        })
            .limit(5);

        res.send({ restaurants });
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'Unable to find nearby restaurants' });
    }
});

module.exports = router;
