const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createProperty(req, res, next) {
  try {
    const landlord = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (landlord.status !== 'active')
      return res.status(403).json({ error: 'Account not yet verified. Cannot post listings.' });

    const {
      listingType, title, description, price,
      locationGeneral, locationExact,
      bedrooms, bathrooms, propertyType, amenities,
    } = req.body;

    const property = await prisma.property.create({
      data: {
        landlordId: req.user.id,
        listingType,
        title,
        description,
        price: parseFloat(price),
        locationGeneral,
        locationExact,
        bedrooms: parseInt(bedrooms),
        bathrooms: parseInt(bathrooms),
        propertyType,
        status: 'pending',
      },
    });

    // Save amenities
    const amenityList = Array.isArray(amenities) ? amenities :
                        typeof amenities === 'string' ? JSON.parse(amenities) : [];
    if (amenityList.length > 0) {
      await prisma.amenity.createMany({
        data: amenityList.map(a => ({ propertyId: property.id, amenityName: a })),
      });
    }

    // Save photos
    const photos = req.files || [];
    if (photos.length > 0) {
      await prisma.propertyPhoto.createMany({
        data: photos.map(f => ({ propertyId: property.id, filePath: f.path })),
      });
    }

    const full = await getFullProperty(property.id);
    res.status(201).json({ property: full });
  } catch (err) {
    next(err);
  }
}

async function getListings(req, res, next) {
  try {
    const { type, location, minPrice, maxPrice, bedrooms, page = 1, limit = 12 } = req.query;
    const where = { status: 'active' };
    if (type) where.listingType = type;
    if (location) where.locationGeneral = { contains: location, mode: 'insensitive' };
    if (bedrooms) where.bedrooms = parseInt(bedrooms);
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [properties, total] = await Promise.all([
      prisma.property.findMany({
        where,
        include: { photos: true, amenities: true, landlord: { select: { id: true, name: true, phone: true, email: true } } },
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.property.count({ where }),
    ]);

    // Determine which listings the requesting tenant has unlocked
    let unlockedIds = new Set();
    if (req.user?.role === 'tenant') {
      const unlocks = await prisma.unlock.findMany({
        where: { tenantId: req.user.id },
        select: { propertyId: true },
      });
      unlockedIds = new Set(unlocks.map(u => u.propertyId));
    }

    const masked = properties.map(p => maskProperty(p, unlockedIds.has(p.id)));
    res.json({ properties: masked, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    next(err);
  }
}

async function getProperty(req, res, next) {
  try {
    const property = await getFullProperty(req.params.id);
    if (!property) return res.status(404).json({ error: 'Property not found' });
    if (property.status !== 'active') return res.status(404).json({ error: 'Property not available' });

    let unlocked = false;
    if (req.user?.role === 'tenant') {
      const unlock = await prisma.unlock.findUnique({
        where: { tenantId_propertyId: { tenantId: req.user.id, propertyId: property.id } },
      });
      unlocked = !!unlock;
    } else if (req.user?.role === 'landlord' && req.user.id === property.landlordId) {
      unlocked = true;
    }

    res.json({ property: maskProperty(property, unlocked), unlocked });
  } catch (err) {
    next(err);
  }
}

async function getLandlordProperties(req, res, next) {
  try {
    const properties = await prisma.property.findMany({
      where: { landlordId: req.user.id },
      include: { photos: true, amenities: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ properties });
  } catch (err) {
    next(err);
  }
}

function maskProperty(p, unlocked) {
  const base = {
    id: p.id,
    listingType: p.listingType,
    title: p.title,
    description: p.description,
    price: p.price,
    locationGeneral: p.locationGeneral,
    bedrooms: p.bedrooms,
    bathrooms: p.bathrooms,
    propertyType: p.propertyType,
    photos: p.photos,
    amenities: p.amenities,
    createdAt: p.createdAt,
    unlocked,
  };

  if (unlocked) {
    base.locationExact = p.locationExact;
    base.landlord = p.landlord;
  } else {
    base.locationExact = null;
    base.landlord = null;
  }

  return base;
}

async function getFullProperty(id) {
  return prisma.property.findUnique({
    where: { id },
    include: {
      photos: true,
      amenities: true,
      landlord: { select: { id: true, name: true, phone: true, email: true } },
    },
  });
}

module.exports = { createProperty, getListings, getProperty, getLandlordProperties };
