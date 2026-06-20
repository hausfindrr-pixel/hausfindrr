const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function sendMessage(req, res, next) {
  try {
    const { propertyId, receiverId, content } = req.body;
    if (!propertyId || !receiverId || !content?.trim())
      return res.status(400).json({ error: 'propertyId, receiverId, and content required' });

    // Verify the sender has unlocked this property (if sender is tenant)
    if (req.user.role === 'tenant') {
      const unlock = await prisma.unlock.findUnique({
        where: { tenantId_propertyId: { tenantId: req.user.id, propertyId } },
      });
      if (!unlock) return res.status(403).json({ error: 'Unlock this property to send messages' });
    }

    const message = await prisma.message.create({
      data: { propertyId, senderId: req.user.id, receiverId, content: content.trim() },
      include: { sender: { select: { id: true, name: true, role: true } } },
    });
    res.status(201).json({ message });
  } catch (err) {
    next(err);
  }
}

async function getThread(req, res, next) {
  try {
    const { propertyId, otherUserId } = req.params;

    const messages = await prisma.message.findMany({
      where: {
        propertyId,
        OR: [
          { senderId: req.user.id, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: req.user.id },
        ],
      },
      include: { sender: { select: { id: true, name: true, role: true } } },
      orderBy: { sentAt: 'asc' },
    });
    res.json({ messages });
  } catch (err) {
    next(err);
  }
}

async function getInbox(req, res, next) {
  try {
    // Get all unique conversation threads for this user
    const messages = await prisma.message.findMany({
      where: {
        OR: [{ senderId: req.user.id }, { receiverId: req.user.id }],
      },
      include: {
        sender: { select: { id: true, name: true, role: true } },
        receiver: { select: { id: true, name: true, role: true } },
        property: { select: { id: true, title: true, photos: { take: 1 } } },
      },
      orderBy: { sentAt: 'desc' },
    });

    // Deduplicate into threads
    const threadMap = new Map();
    for (const msg of messages) {
      const otherId = msg.senderId === req.user.id ? msg.receiverId : msg.senderId;
      const key = `${msg.propertyId}:${otherId}`;
      if (!threadMap.has(key)) {
        threadMap.set(key, {
          propertyId: msg.propertyId,
          property: msg.property,
          otherUser: msg.senderId === req.user.id ? msg.receiver : msg.sender,
          latestMessage: msg,
        });
      }
    }

    res.json({ threads: Array.from(threadMap.values()) });
  } catch (err) {
    next(err);
  }
}

module.exports = { sendMessage, getThread, getInbox };
