const express = require('express')
const User = require('../models/user')
const Order = require('../models/order')
const Restaurant = require('../models/restaurant')
const auth = require('../middleware/auth')
const router = new express.Router()

// Create User
router.post('/users', async (req, res) => {
    const user = new User(req.body)

    try {
        await user.save()
        const token = await user.generateAuthToken()
        res.status(201).send({ user, token })
    } catch (error) {
        res.status(400).send(error)
    }
})
// Login User
router.post('/users/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password)
        const token = await user.generateAuthToken()
        res.send({ user, token })
    } catch (e) {
        res.status(400).send()
    }
})

router.post('/users/logout', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token
        })
        await req.user.save()

        res.send()
    } catch (error) {
        res.status(500).send()
    }
})

// Create User Adress
router.post('/users/add-address', auth, async (req, res) => {
    try {
        const userId = req.user._id;
        const newAddress = req.body.address;

        const user = await User.findById(userId);
        user.addresses.push({ address: newAddress });
        await user.save();

        res.status(201).send({ message: 'Address added successfully', user });
    } catch (error) {
        res.status(400).send({ error: 'Unable to add address' });
    }
});

// Place Order
router.post('/users/place-order', auth, async (req, res) => {
    try {
        const userId = req.user._id; // Get the authenticated user's ID
        const { restaurantId, menuItems } = req.body;

        // Check if the restaurant exists
        const restaurant = await Restaurant.findById(restaurantId);
        if (!restaurant) {
            return res.status(404).send({ error: 'Restaurant not found' });
        }

        // Check if all menu items exist in the restaurant's menu
        const menuItemsExist = menuItems.every(menuItemId => restaurant.menu.some(menuItem => menuItem._id == menuItemId));
        if (!menuItemsExist) {
            return res.status(400).send({ error: 'One or more menu items do not exist in the restaurant\'s menu' });
        }

        const totalAmount = menuItems.reduce((sum, menuItemId) => {
            const menuItem = restaurant.menu.find(item => item._id == menuItemId);
            return sum + menuItem.price;
        }, 0);

        const order = new Order({
            user: userId,
            restaurant: restaurantId,
            items: menuItems.map(menuItemId => {
                const menuItem = restaurant.menu.find(item => item._id == menuItemId);
                return { name: menuItem.name, price: menuItem.price, quantity: 1 }; // Assuming quantity is always 1
            }),
            totalAmount,
        });

        // Save the order
        await order.save();

        res.status(201).send({ message: 'Order placed successfully', order });
    } catch (error) {
        res.status(400).send({ error: 'Unable to place order' });
    }
});

// Comment & Score
router.post('/users/add-comment/:orderId', auth, async (req, res) => {
    try {
        const userId = req.user._id;
        const orderId = req.params.orderId;
        const { comment, score } = req.body;

        // Check if the user has already commented or scored for this order
        const order = await Order.findOne({ _id: orderId, user: userId, comment: { $exists: true, $ne: '' }, score: { $exists: true } });
        if (order) {
            return res.status(400).send({ error: 'You can comment and score only once for this order' });
        }

        // Find the order
        const orderToUpdate = await Order.findOne({ _id: orderId, user: userId });
        if (!orderToUpdate) {
            return res.status(404).send({ error: 'Order not found' });
        }

        // Update the order with the comment and score
        orderToUpdate.comment = comment;
        orderToUpdate.score = score;

        await orderToUpdate.save();

        const restaurantId = orderToUpdate.restaurant;
        const ordersForRestaurant = await Order.find({ restaurant: restaurantId, score: { $exists: true } });

        const totalScore = ordersForRestaurant.reduce((sum, order) => sum + order.score, 0);
        const ordersCount = ordersForRestaurant.length;
        const averageScore = ordersCount > 0 ? totalScore / ordersCount : 0;

        // Update the restaurant with the calculated average score
        const restaurant = await Restaurant.findById(restaurantId);
        restaurant.score = averageScore;

        await restaurant.save();

        res.send({ message: 'Comment added successfully', order: orderToUpdate });
    } catch (error) {
        res.status(400).send({ error: 'Unable to add comment' });
    }
}); router.post('/users/add-comment/:orderId', auth, async (req, res) => {
    try {
        const userId = req.user._id;
        const orderId = req.params.orderId;
        const { comment, score } = req.body;

        // Check if the user has already commented or scored for this order
        const order = await Order.findOne({ _id: orderId, user: userId, comment: { $exists: true, $ne: '' }, score: { $exists: true } });
        if (order) {
            return res.status(400).send({ error: 'You can comment and score only once for this order' });
        }

        // Find the order
        const orderToUpdate = await Order.findOne({ _id: orderId, user: userId });
        if (!orderToUpdate) {
            return res.status(404).send({ error: 'Order not found' });
        }

        // Update the order with the comment and score
        orderToUpdate.comment = comment;
        orderToUpdate.score = score;

        await orderToUpdate.save();

        const restaurantId = orderToUpdate.restaurant;
        const ordersForRestaurant = await Order.find({ restaurant: restaurantId, score: { $exists: true } });

        const totalScore = ordersForRestaurant.reduce((sum, order) => sum + order.score, 0);
        const ordersCount = ordersForRestaurant.length;
        const averageScore = ordersCount > 0 ? totalScore / ordersCount : 0;

        // Update the restaurant with the calculated average score
        const restaurant = await Restaurant.findById(restaurantId);
        restaurant.score = averageScore;

        await restaurant.save();

        res.send({ message: 'Comment added successfully', order: orderToUpdate });
    } catch (error) {
        res.status(400).send({ error: 'Unable to add comment' });
    }
});


module.exports = router;