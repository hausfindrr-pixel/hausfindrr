/**
 * One-time backfill: send welcome Messages (in-app inbox) to all existing
 * tenants and landlords who registered before this feature existed.
 *
 * Run once via:
 *   cd backend && node scripts/backfill-welcome-messages.js
 *
 * Idempotent: skips users who already have a message from the admin.
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const CONTENT = {
  tenant: `Welcome to HausFindrr — PNG's property marketplace! 🏠

You can now browse hundreds of rental and sale listings across the country. To see the full details of any listing — including the exact address and the landlord's direct contact — simply unlock it for a one-time fee of K25.

A few tips to get started:
• Browse listings from the homepage
• Tap "Unlock Now" on any listing that interests you
• Save favourites with the heart icon
• Message the landlord directly once you've unlocked a listing

Happy house hunting! If you ever need help, reply to this message or email us at support@hausfindrr.com.

— The HausFindrr Team`,

  landlord: `Welcome to HausFindrr — PNG's fastest-growing property platform! 🏠

Your account has been created and is currently under review. Our admin team will verify your identity and uploaded documents within 1–2 business days.

What happens next:
• We'll review your ID document and account details
• Once approved, you'll be able to post property listings
• Tenants can then browse and unlock your listings to get in touch

To speed up verification, make sure your ID document is uploaded clearly in your account. Listings you submit will be reviewed by our team before going live — this keeps the platform safe and trustworthy for everyone.

Questions? Reply to this message or email support@hausfindrr.com.

— The HausFindrr Team`,
};

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    console.error('ADMIN_EMAIL environment variable is not set. Aborting.');
    process.exit(1);
  }

  const admin = await prisma.user.findFirst({
    where: { email: adminEmail.toLowerCase(), role: 'admin' },
  });

  if (!admin) {
    console.error(`No admin user found with email "${adminEmail}". Aborting.`);
    process.exit(1);
  }

  console.log(`Using admin: ${admin.name} (${admin.id})\n`);

  // Find all tenants and landlords
  const users = await prisma.user.findMany({
    where: { role: { in: ['tenant', 'landlord'] } },
    select: { id: true, name: true, email: true, role: true },
    orderBy: { role: 'asc' },
  });

  console.log(`Found ${users.length} users (tenants + landlords) to check.\n`);

  // Fetch all existing messages from admin to these users (null propertyId = direct/system)
  const existingMessages = await prisma.message.findMany({
    where: {
      senderId: admin.id,
      propertyId: null,
      receiverId: { in: users.map(u => u.id) },
    },
    select: { receiverId: true },
  });

  const alreadyMessaged = new Set(existingMessages.map(m => m.receiverId));
  console.log(`${alreadyMessaged.size} users already have a welcome message — skipping.\n`);

  const toMessage = users.filter(u => !alreadyMessaged.has(u.id));
  console.log(`Sending welcome messages to ${toMessage.length} users...\n`);

  let sent = 0;
  let errored = 0;

  for (const user of toMessage) {
    const content = CONTENT[user.role];
    if (!content) continue;
    try {
      await prisma.message.create({
        data: {
          propertyId: null,
          senderId: admin.id,
          receiverId: user.id,
          content,
        },
      });
      console.log(`  ✓  [${user.role}] ${user.name} <${user.email}>`);
      sent++;
    } catch (err) {
      console.error(`  ✗  [${user.role}] ${user.name} <${user.email}>: ${err.message}`);
      errored++;
    }
  }

  console.log(`\nDone. Sent: ${sent}  Skipped (already had): ${alreadyMessaged.size}  Errors: ${errored}`);
}

main()
  .catch(err => { console.error('Fatal error:', err); process.exit(1); })
  .finally(() => prisma.$disconnect());
