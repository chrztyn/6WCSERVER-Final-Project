const Balance = require('../models/balance');

async function updateBalancesAfterExpense(groupId, memberShare, payorUsers) {
  for (let debtorId of Object.keys(memberShare)) {
    const balanceValue = memberShare[debtorId];

    if (balanceValue > 0) {
      for (let payor of payorUsers) {
        const payorId = payor._id.toString();

        if (debtorId !== payorId) {
          let balance = await Balance.findOne({
            group_id: groupId,
            user_id: debtorId,
            owed_to: payorId
          });

          const owedAmount = balanceValue / payorUsers.length;

          if (balance) {
            balance.amount += owedAmount;
            balance.status = 'unpaid';
            await balance.save();
          } else {
            const newBalance = new Balance({
              group_id: groupId,
              user_id: debtorId,
              owed_to: payorId,
              amount: owedAmount,
              status: 'unpaid'
            });
            await newBalance.save();
          }
        }
      }
    }
  }
}

// Reverse balances when expense is deleted or updated
async function reverseBalancesAfterExpense(groupId, memberShare, payorUsers) {
  for (let debtorId of Object.keys(memberShare)) {
    const balanceValue = memberShare[debtorId];

    if (balanceValue > 0) {
      for (let payor of payorUsers) {
        const payorId = payor._id.toString();

        if (debtorId !== payorId) {
          let balance = await Balance.findOne({
            group_id: groupId,
            user_id: debtorId,
            owed_to: payorId
          });

          const owedAmount = balanceValue / payorUsers.length;

          if (balance) {
            balance.amount -= owedAmount;

            if (balance.amount <= 0) {
              await balance.deleteOne();
            } else {
              balance.status = 'unpaid';
              await balance.save();
            }
          }
        }
      }
    }
  }
}

async function applyPayment(payerId, groupId, amount) {
  let balances = await Balance.find({
    group_id: groupId,
    user_id: payerId
  });

  if (!balances || balances.length === 0) {
    return { updated: [], remaining: amount };
  }

  let amountLeft = amount;
  for (let bal of balances) {
    if (amountLeft <= 0) break;

    if (bal.amount > 0) {
      const reduction = Math.min(bal.amount, amountLeft);
      bal.amount -= reduction;
      amountLeft -= reduction;
      bal.status = bal.amount === 0 ? 'paid' : 'unpaid'; 
      await bal.save(); 
    }
  }

  return { updated: balances, remaining: amountLeft };
}

module.exports = { 
  updateBalancesAfterExpense, 
  reverseBalancesAfterExpense, 
  applyPayment 
};