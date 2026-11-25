const { PrismaClient } = require('@prisma/client');
const { signedUrl } = require('../services/documentService');

const prisma = new PrismaClient();

// type param: 'id' (LandlordIdDocument) or 'title' (PropertyTitleDocument)
async function getDocumentSignedUrl(req, res, next) {
  try {
    const { type, id } = req.params;
    let doc;

    if (type === 'id') {
      doc = await prisma.landlordIdDocument.findUnique({ where: { id } });
    } else if (type === 'title') {
      doc = await prisma.propertyTitleDocument.findUnique({ where: { id } });
    } else {
      return res.status(400).json({ error: 'Invalid document type. Use "id" or "title".' });
    }

    if (!doc) return res.status(404).json({ error: 'Document not found' });
    if (!doc.publicId) return res.status(422).json({ error: 'Document has no Cloudinary public_id; it may have been uploaded before private storage was enabled.' });

    const url = signedUrl(doc.publicId);
    res.json({ url, expiresInSeconds: 900, legalHold: doc.legalHold, expiresAt: doc.expiresAt });
  } catch (err) {
    next(err);
  }
}

async function setDocumentLegalHold(req, res, next) {
  try {
    const { type, id } = req.params;
    const { legalHold } = req.body;

    if (typeof legalHold !== 'boolean')
      return res.status(400).json({ error: 'legalHold must be a boolean' });

    let doc;
    if (type === 'id') {
      doc = await prisma.landlordIdDocument.update({ where: { id }, data: { legalHold } });
    } else if (type === 'title') {
      doc = await prisma.propertyTitleDocument.update({ where: { id }, data: { legalHold } });
    } else {
      return res.status(400).json({ error: 'Invalid document type. Use "id" or "title".' });
    }

    res.json({ id: doc.id, legalHold: doc.legalHold });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Document not found' });
    next(err);
  }
}

module.exports = { getDocumentSignedUrl, setDocumentLegalHold };
