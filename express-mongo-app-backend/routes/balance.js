const express = require('express');
const authMiddleware = require('../middleware/auth');
const Users = require('../models/users'); 
const Balance = require('../models/balance');
const router = express.Router();


// VIEW summary of balances of the user
router.get('/summary/me', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id.toString();

    const balancesAsDebtor = await Balance.find({ user_id: userId })
      .populate([
        { path: 'owed_to', select: 'name email -_id' },
        { path: 'group_id', select: 'name description -_id' }
    ]);

    const balancesAsCreditor = await Balance.find({ owed_to: userId })
      .populate([
        { path: 'user_id', select: 'name email -_id' },
        { path: 'group_id', select: 'name description -_id' }
    ]);

    let owes = 0;
    let owed = 0;

    balancesAsDebtor.forEach(b => { owes += b.amount; });
    balancesAsCreditor.forEach(b => { owed += b.amount; });

    const net = owed - owes;


    let groupSummary = {};

    balancesAsDebtor.forEach(b => {
      const g = b.group_id ? b.group_id.name : 'Unknown Group';
      if (!groupSummary[g]) groupSummary[g] = { owes: 0, owed: 0 };
      groupSummary[g].owes += b.amount;
    });

    balancesAsCreditor.forEach(b => {
      const g = b.group_id ? b.group_id.name : 'Unknown Group';
      if (!groupSummary[g]) groupSummary[g] = { owes: 0, owed: 0 };
      groupSummary[g].owed += b.amount;
    });

    res.json({
      user: {
        id: userId,
        name: req.user.name,
        email: req.user.email
      },
      total: { Debts: owes, Credits: owed, Net: net },
      byGroup: Object.keys(groupSummary).map(group => ({
        group,
        Debts: groupSummary[group].owes,
        Credits: groupSummary[group].owed,
        Net: groupSummary[group].owed - groupSummary[group].owes
      }))
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch global balance summary', details: err.message });
  }
});

// VIEW summary of balance per user in a group 
router.get('/summary/:groupId', authMiddleware, async (req, res) => {
  try {
    const { groupId } = req.params;

    const balances = await Balance.find({ group_id: groupId });
    if (balances.length === 0) {
      return res.json({ message: 'No balances found for this group', summary: [] });
    }

    let summary = [];

    for (let bal of balances) {
      const debtor = await Users.findById(bal.user_id).select('name email -_id');
      const creditor = await Users.findById(bal.owed_to).select('name email -_id');

      if (debtor && creditor) {
        summary.push({
          Debtor: debtor.name,
          Creditor: creditor.name,
          Amount: bal.amount
        });
      }
    }

    res.json({ group: groupId, summary });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch balance summary', details: err.message });
  }
});


module.exports = router;