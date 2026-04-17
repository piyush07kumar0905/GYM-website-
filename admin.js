const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Order = require('../models/Order');
const Membership = require('../models/Membership');

const router = express.Router();


const adminAuth = async (req, res, next) => {
  try {
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer '))
      return res.status(401).json({ success: false, message: 'Not authenticated.' });
    const decoded = jwt.verify(auth.split(' ')[1], process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user || user.role !== 'admin')
      return res.status(403).json({ success: false, message: 'Admin only.' });
    req.user = user;
    next();
  } catch (_) {
    res.status(401).json({ success: false, message: 'Invalid token.' });
  }
};



router.get('/dashboard', adminAuth, async (req, res) => {
  try {
    const [totalUsers, totalOrders, totalMemberships, recentOrders, recentMemberships] =
      await Promise.all([
        User.countDocuments(),
        Order.countDocuments(),
        Membership.countDocuments({ status: 'active' }),
        Order.find().sort({ createdAt: -1 }).limit(10).populate('user', 'name email'),
        Membership.find().sort({ createdAt: -1 }).limit(10).populate('user', 'name email'),
      ]);


    const revenueResult = await Order.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      { $group: { _id: null, total: { $sum: '$totalINR' } } },
    ]);
    const totalRevenue = revenueResult[0]?.total || 0;

    res.json({
      success: true,
      stats: { totalUsers, totalOrders, totalMemberships, totalRevenue },
      recentOrders,
      recentMemberships,
    });
  } catch (err) {
    console.error('Admin dashboard error:', err);
    res.status(500).json({ success: false, message: 'Failed to load dashboard.' });
  }
});

// Yaha pe user ka api 

router.get('/users', adminAuth, async (req, res) => {
  try {
    const users = await User.find().populate('activeMembership').sort({ createdAt: -1 });
    res.json({ success: true, count: users.length, users });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch users.' });
  }
});


// /api/admin/users/:id/role

router.patch('/users/:id/role', adminAuth, async (req, res) => {
  try {
    const { role } = req.body;
    if (!['member', 'admin'].includes(role))
      return res.status(400).json({ success: false, message: 'Invalid role.' });
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
    res.json({ success: true, message: 'User role updated.', user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update role.' });
  }
});

module.exports = router;
