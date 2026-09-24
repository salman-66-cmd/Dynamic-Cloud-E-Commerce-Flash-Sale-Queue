/**
 * High-Concurrency & Zero-Overselling Automated Verification Test
 * 
 * Verifies requirement:
 * 100 simultaneous purchase requests with only 10 units available.
 * Expected:
 * - Exactly 10 successful reservations
 * - Exactly 90 rejected requests (SOLD_OUT)
 * - Remaining stock strictly >= 0 (no negative stock!)
 */

const { connectDB } = require('../src/config/db');
const queueManager = require('../src/queue/queueManager');
const workerPool = require('../src/workers/workerPool');
const FlashSale = require('../src/models/FlashSale');
const Product = require('../src/models/Product');
const QueueEntry = require('../src/models/QueueEntry');
const Order = require('../src/models/Order');
const seedInitialData = require('../src/utils/seedData');

async function runConcurrencyStressTest() {
  console.log('\n=======================================================');
  console.log('⚡ STARTING HIGH-CONCURRENCY OVERSELLING STRESS TEST ⚡');
  console.log('=======================================================');

  await connectDB();
  await seedInitialData();

  // Create or reset a dedicated test Flash Sale with strictly 10 units
  const testSale = await FlashSale.create({
    productId: 'prod_test_concurrency_4090',
    title: 'Stress Test: 100 Users vs 10 Laptops',
    originalPrice: 2999,
    salePrice: 999,
    discountPercentage: 66,
    totalStock: 10,
    remainingStock: 10,
    startTime: new Date(),
    endTime: new Date(Date.now() + 3600000),
    status: 'ACTIVE',
  });

  const saleId = String(testSale._id || testSale.id);
  console.log(`[TEST SETUP] Created test Flash Sale: ${saleId}`);
  console.log(`[TEST SETUP] Initial Inventory: 10 units`);
  console.log(`[TEST SETUP] Injecting 100 simultaneous user requests...\n`);

  // Start worker pool to process queue
  workerPool.start();

  const totalUsers = 100;
  const enqueuePromises = [];

  const startTime = Date.now();

  for (let i = 1; i <= totalUsers; i++) {
    enqueuePromises.push(
      queueManager.enqueue({
        userId: `stress_user_${i}`,
        userName: `Test Shopper #${i}`,
        userEmail: `shopper${i}@test.cloud`,
        flashSaleId: saleId,
        productId: 'prod_test_concurrency_4090',
      })
    );
  }

  const enqueueResults = await Promise.all(enqueuePromises);
  const successfullyEnqueued = enqueueResults.filter(r => r.success).length;
  console.log(`[QUEUE RESULT] 100/100 requests entered the virtual queue successfully.`);

  // Wait for worker pool to process all 100 queued items
  console.log(`[WORKER POOL] Workers processing queue concurrently...`);

  let maxWaitCycles = 50; // up to ~15 seconds
  while (maxWaitCycles > 0) {
    await new Promise(r => setTimeout(r, 300));
    const pendingCount = await QueueEntry.countDocuments({
      flashSaleId: saleId,
      status: { $in: ['WAITING', 'PROCESSING'] },
    });

    if (pendingCount === 0) {
      break;
    }
    maxWaitCycles--;
  }

  workerPool.stop();

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`[PROCESSING COMPLETE] Finished in ${duration}s.\n`);

  // Verify results in database
  const updatedSale = await FlashSale.findById(saleId);
  const successEntries = await QueueEntry.find({ flashSaleId: saleId, status: 'PAYMENT_PENDING' });
  const soldOutEntries = await QueueEntry.find({ flashSaleId: saleId, status: 'FAILED', failureReason: 'SOLD_OUT' });
  const createdOrders = await Order.find({ flashSaleId: saleId });

  console.log('================ TEST ASSERTIONS ================');
  console.log(`Total Initial Stock:       10`);
  console.log(`Simultaneous Requests:     ${totalUsers}`);
  console.log(`Successful Reservations:   ${successEntries.length}`);
  console.log(`Sold-Out Rejections:       ${soldOutEntries.length}`);
  console.log(`Created Pending Orders:    ${createdOrders.length}`);
  console.log(`Remaining Flash Sale Stock:${updatedSale.remainingStock}`);
  console.log('=================================================\n');

  let passed = true;

  if (successEntries.length !== 10) {
    console.error(`❌ FAILURE: Expected exactly 10 successful reservations, got ${successEntries.length}`);
    passed = false;
  } else {
    console.log(`✅ PASS: Exactly 10 successful reservations created.`);
  }

  if (soldOutEntries.length !== 90) {
    console.error(`❌ FAILURE: Expected exactly 90 sold-out entries, got ${soldOutEntries.length}`);
    passed = false;
  } else {
    console.log(`✅ PASS: Exactly 90 shoppers received 'SOLD_OUT' rejection gracefully.`);
  }

  if (updatedSale.remainingStock < 0) {
    console.error(`❌ CRITICAL FAILURE: Stock went below zero! (Remaining: ${updatedSale.remainingStock})`);
    passed = false;
  } else if (updatedSale.remainingStock !== 0) {
    console.error(`❌ FAILURE: Stock should be exhausted to 0, but is ${updatedSale.remainingStock}`);
    passed = false;
  } else {
    console.log(`✅ PASS: Stock reached exactly 0 without any overselling.`);
  }

  if (createdOrders.length > 10) {
    console.error(`❌ FAILURE: More than 10 orders were created! (${createdOrders.length})`);
    passed = false;
  } else {
    console.log(`✅ PASS: Exactly 10 orders were generated.`);
  }

  console.log('\n=================================================');
  if (passed) {
    console.log('🎉 ALL CONCURRENCY & ZERO-OVERSELLING TESTS PASSED! 🎉');
    console.log('=================================================\n');
    process.exit(0);
  } else {
    console.log('💥 CONCURRENCY TESTS FAILED! 💥');
    console.log('=================================================\n');
    process.exit(1);
  }
}

runConcurrencyStressTest().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
