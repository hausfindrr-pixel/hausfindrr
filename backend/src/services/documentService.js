const { cloudinary } = require('../middleware/upload');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

function expiresAt() {
  return new Date(Date.now() + THIRTY_DAYS_MS);
}

// Generate a short-lived signed URL for a private Cloudinary asset.
// Duration: 15 minutes (900 seconds).
function signedUrl(publicId, resourceType = 'image') {
  return cloudinary.utils.private_download_url(publicId, 'jpg', {
    resource_type: resourceType,
    expires_at: Math.floor(Date.now() / 1000) + 900,
    attachment: false,
  });
}

// Delete documents that have passed their expiresAt and have no legal hold.
async function purgeExpiredDocuments() {
  const now = new Date();

  const expiredId = await prisma.landlordIdDocument.findMany({
    where: { legalHold: false, expiresAt: { lt: now } },
    select: { id: true, publicId: true },
  });

  const expiredTitle = await prisma.propertyTitleDocument.findMany({
    where: { legalHold: false, expiresAt: { lt: now } },
    select: { id: true, publicId: true },
  });

  for (const doc of [...expiredId, ...expiredTitle]) {
    if (doc.publicId) {
      try {
        await cloudinary.uploader.destroy(doc.publicId, { type: 'private', resource_type: 'raw' });
      } catch (err) {
        // Log but don't block DB cleanup
        console.error(`[docPurge] Cloudinary delete failed for ${doc.publicId}:`, err.message);
      }
    }
  }

  if (expiredId.length > 0) {
    await prisma.landlordIdDocument.deleteMany({
      where: { id: { in: expiredId.map(d => d.id) } },
    });
  }
  if (expiredTitle.length > 0) {
    await prisma.propertyTitleDocument.deleteMany({
      where: { id: { in: expiredTitle.map(d => d.id) } },
    });
  }

  const count = expiredId.length + expiredTitle.length;
  if (count > 0) console.log(`[docPurge] Purged ${count} expired document(s).`);
  return count;
}

module.exports = { expiresAt, signedUrl, purgeExpiredDocuments };
