const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const VALID_STATUSES = ['new', 'under_review', 'resolved'];
const VALID_TYPES = [
  'landlord_not_responding',
  'listing_details_incorrect',
  'suspicious_activity',
  'other',
  'platform_feedback',
];

async function createComplaint(req, res, next) {
  try {
    const { landlordId, propertyId, type, details, context } = req.body;
    if (!type || !VALID_TYPES.includes(type))
      return res.status(400).json({ error: 'Invalid complaint type' });

    const complaint = await prisma.complaint.create({
      data: {
        tenantId: req.user.id,
        landlordId: landlordId || null,
        propertyId: propertyId || null,
        type,
        details: details?.trim() || null,
        context: context || 'landlord',
      },
    });
    res.status(201).json({ complaint });
  } catch (err) {
    next(err);
  }
}

async function getComplaints(req, res, next) {
  try {
    const complaints = await prisma.complaint.findMany({
      include: {
        tenant:   { select: { id: true, name: true, email: true, phone: true } },
        landlord: { select: { id: true, name: true, email: true, phone: true } },
        property: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    const newCount = complaints.filter(c => c.status === 'new').length;
    res.json({ complaints, newCount });
  } catch (err) {
    next(err);
  }
}

async function updateComplaintStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!VALID_STATUSES.includes(status))
      return res.status(400).json({ error: 'Invalid status' });

    const complaint = await prisma.complaint.update({
      where: { id },
      data: { status },
    });
    res.json({ complaint });
  } catch (err) {
    next(err);
  }
}

module.exports = { createComplaint, getComplaints, updateComplaintStatus };
