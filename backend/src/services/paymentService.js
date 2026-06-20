const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const UNLOCK_AMOUNT = 25.00;

/**
 * Simulated payment processor — swap internals for real Kumul Pay Visa API later.
 * The public contract (parameters, return shape, transaction logging) stays the same.
 */
async function processUnlockPayment(tenantId, propertyId, amount, cardDetails) {
  // Log transaction as pending first
  const transaction = await prisma.transaction.create({
    data: {
      tenantId,
      propertyId,
      amount,
      status: 'pending',
      paymentMethod: 'visa',
    },
  });

  // --- Replace this block with real Kumul Pay integration ---
  const simulatedSuccess = _simulateKumulPay(cardDetails);
  // ----------------------------------------------------------

  const status = simulatedSuccess ? 'success' : 'failed';
  const updated = await prisma.transaction.update({
    where: { id: transaction.id },
    data: { status },
  });

  return { transaction: updated, success: simulatedSuccess };
}

function _simulateKumulPay(cardDetails) {
  // Treat card number ending in 0000 as a forced failure for testing
  if (!cardDetails || !cardDetails.number) return false;
  return !cardDetails.number.trim().endsWith('0000');
}

async function getUnlockFee() {
  return UNLOCK_AMOUNT;
}

module.exports = { processUnlockPayment, getUnlockFee, UNLOCK_AMOUNT };
