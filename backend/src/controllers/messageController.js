const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function sendMessage(req, res, next) {
  try {
    const { propertyId, receiverId, content } = req.body;
    if (!propertyId || !receiverId || !content?.trim())
      return res.status(400).json({ error: 'propertyId, receiverId, and content required' });

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

// Admin direct message to a landlord (no property context)
async function sendDirectMessage(req, res, next) {
  try {
    const { receiverId, content } = req.body;
    if (!receiverId || !content?.trim())
      return res.status(400).json({ error: 'receiverId and content required' });

    const receiver = await prisma.user.findUnique({ where: { id: receiverId } });
    if (!receiver) return res.status(404).json({ error: 'Recipient not found' });

    const message = await prisma.message.create({
      data: { propertyId: null, senderId: req.user.id, receiverId, content: content.trim() },
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

// Thread for null-propertyId admin direct messages
async function getDirectThread(req, res, next) {
  try {
    const { otherUserId } = req.params;
    const messages = await prisma.message.findMany({
      where: {
        propertyId: null,
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

async function markRead(req, res, next) {
  try {
    const { propertyId, otherUserId } = req.params;
    await prisma.message.updateMany({
      where: {
        propertyId,
        senderId: otherUserId,
        receiverId: req.user.id,
        readAt: null,
      },
      data: { readAt: new Date() },
    });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

async function markDirectRead(req, res, next) {
  try {
    const { otherUserId } = req.params;
    await prisma.message.updateMany({
      where: {
        propertyId: null,
        senderId: otherUserId,
        receiverId: req.user.id,
        readAt: null,
      },
      data: { readAt: new Date() },
    });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

async function getInbox(req, res, next) {
  try {
    const messages = await prisma.message.findMany({
      where: {
        OR: [{ senderId: req.user.id }, { receiverId: req.user.id }],
      },
      include: {
        sender:   { select: { id: true, name: true, role: true } },
        receiver: { select: { id: true, name: true, role: true } },
        property: { select: { id: true, title: true, photos: { take: 1 } } },
      },
      orderBy: { sentAt: 'desc' },
    });

    const threadMap = new Map();
    const unreadMap = new Map();

    for (const msg of messages) {
      const otherId = msg.senderId === req.user.id ? msg.receiverId : msg.senderId;
      // null propertyId groups under "direct:otherId"
      const key = msg.propertyId ? `${msg.propertyId}:${otherId}` : `direct:${otherId}`;

      if (!threadMap.has(key)) {
        threadMap.set(key, {
          propertyId:  msg.propertyId,
          property:    msg.property,
          otherUser:   msg.senderId === req.user.id ? msg.receiver : msg.sender,
          latestMessage: msg,
          unreadCount: 0,
          isDirect:    !msg.propertyId,
        });
      }

      if (msg.receiverId === req.user.id && !msg.readAt) {
        unreadMap.set(key, (unreadMap.get(key) || 0) + 1);
      }
    }

    for (const [key, thread] of threadMap) {
      thread.unreadCount = unreadMap.get(key) || 0;
    }

    res.json({ threads: Array.from(threadMap.values()) });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  sendMessage, sendDirectMessage,
  getThread, getDirectThread,
  markRead, markDirectRead,
  getInbox,
};
