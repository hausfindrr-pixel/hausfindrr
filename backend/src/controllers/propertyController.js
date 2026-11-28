const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createProperty(req, res, next) {
  try {
    const landlord = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (landlord.status === 'rejected' || landlord.status === 'suspended')
      return res.status(403).json({ error: 'Your account is not in good standing. Please contact support.' });

    if (landlord.status !== 'active') {
      const idCount = await prisma.landlordIdDocument.count({ where: { userId: landlord.id } });
      if (idCount === 0)
        return res.status(403).json({ error: 'Please upload your ID document before submitting a listing.' });
    }

    const {
      listingType, title, description, price,
      locationGeneral, locationExact,
      location_lat, location_lng,
      bedrooms, bathrooms, propertyType, amenities, rentFrequency,
      metadata,
    } = req.body;

    if (listingType && listingType !== 'rent')
      return res.status(400).json({ error: 'Only rental listings are supported at this time.' });

    const parsedMetadata = metadata
      ? (typeof metadata === 'string' ? JSON.parse(metadata) : metadata)
      : null;

    const property = await prisma.property.create({
      data: {
        landlordId: req.user.id,
        listingType,
        title,
        description,
        price: parseFloat(price),
        locationGeneral,
        locationExact,
        locationLat: location_lat ? parseFloat(location_lat) : null,
        locationLng: location_lng ? parseFloat(location_lng) : null,
        bedrooms: bedrooms !== undefined && bedrooms !== '' ? parseInt(bedrooms) : null,
        bathrooms: bathrooms !== undefined && bathrooms !== '' ? parseInt(bathrooms) : null,
        propertyType,
        rentFrequency: listingType === 'rent' ? (rentFrequency || null) : null,
        metadata: parsedMetadata,
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

    // Save photos (field: photos)
    const files = req.files || {};
    const photoFiles = Array.isArray(files) ? files : (files['photos'] || []);
    if (photoFiles.length > 0) {
      await prisma.propertyPhoto.createMany({
        data: photoFiles.map(f => ({ propertyId: property.id, filePath: f.path })),
      });
    }

    // Save title documents (field: title_documents) — private Cloudinary storage
    const titleDocs = files['title_documents'] || [];
    if (titleDocs.length > 0) {
      const docExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      await prisma.propertyTitleDocument.createMany({
        data: titleDocs.map((f, i) => ({
          propertyId: property.id,
          docType: i === 0 ? 'title' : 'other',
          filePath: f.path,
          publicId: f.filename || null,
          expiresAt: docExpiry,
        })),
      });
    }

    // Funnel tracking (non-fatal)
    try {
      await prisma.funnelEvent.create({ data: { event: 'listing_submitted', campaign: null } });
    } catch {}

    const full = await getFullProperty(property.id);
    res.status(201).json({ property: full });
  } catch (err) {
    next(err);
  }
}

async function updateProperty(req, res, next) {
  try {
    const { id } = req.params;
    const property = await prisma.property.findUnique({ where: { id } });
    if (!property) return res.status(404).json({ error: 'Property not found' });
    if (property.landlordId !== req.user.id)
      return res.status(403).json({ error: 'Not your property' });

    const {
      listingType, title, description, price,
      locationGeneral, locationExact,
      location_lat, location_lng,
      bedrooms, bathrooms, propertyType, amenities, rentFrequency,
      metadata,
    } = req.body;

    if (listingType && listingType !== 'rent')
      return res.status(400).json({ error: 'Only rental listings are supported at this time.' });

    const effectiveType = listingType || property.listingType;
    const updated = await prisma.property.update({
      where: { id },
      data: {
        ...(listingType && { listingType }),
        ...(title && { title }),
        ...(description && { description }),
        ...(price && { price: parseFloat(price) }),
        ...(locationGeneral && { locationGeneral }),
        ...(locationExact && { locationExact }),
        ...(location_lat !== undefined && { locationLat: location_lat ? parseFloat(location_lat) : null }),
        ...(location_lng !== undefined && { locationLng: location_lng ? parseFloat(location_lng) : null }),
        bedrooms: bedrooms !== undefined && bedrooms !== '' ? parseInt(bedrooms) : null,
        bathrooms: bathrooms !== undefined && bathrooms !== '' ? parseInt(bathrooms) : null,
        ...(propertyType && { propertyType }),
        rentFrequency: effectiveType === 'rent' ? (rentFrequency || null) : null,
        ...(metadata !== undefined && {
          metadata: metadata
            ? (typeof metadata === 'string' ? JSON.parse(metadata) : metadata)
            : null,
        }),
      },
    });

    // Update amenities if provided
    if (amenities !== undefined) {
      await prisma.amenity.deleteMany({ where: { propertyId: id } });
      const amenityList = Array.isArray(amenities) ? amenities :
                          typeof amenities === 'string' ? JSON.parse(amenities) : [];
      if (amenityList.length > 0) {
        await prisma.amenity.createMany({
          data: amenityList.map(a => ({ propertyId: id, amenityName: a })),
        });
      }
    }

    const full = await getFullProperty(id);
    res.json({ property: full });
  } catch (err) {
    next(err);
  }
}

async function toggleOccupied(req, res, next) {
  try {
    const { id } = req.params;
    const property = await prisma.property.findUnique({ where: { id } });
    if (!property) return res.status(404).json({ error: 'Property not found' });
    if (property.landlordId !== req.user.id)
      return res.status(403).json({ error: 'Not your property' });
    if (property.listingType !== 'rent')
      return res.status(400).json({ error: 'Occupied toggle only applies to rental listings' });
    if (property.status !== 'active')
      return res.status(400).json({ error: 'Only active listings can be toggled' });

    const updated = await prisma.property.update({
      where: { id },
      data: { occupied: !property.occupied },
    });
    res.json({ occupied: updated.occupied });
  } catch (err) {
    next(err);
  }
}

async function markSold(req, res, next) {
  try {
    const { id } = req.params;
    const property = await prisma.property.findUnique({ where: { id } });
    if (!property) return res.status(404).json({ error: 'Property not found' });
    if (property.landlordId !== req.user.id)
      return res.status(403).json({ error: 'Not your property' });
    if (property.listingType !== 'sale')
      return res.status(400).json({ error: 'Mark as sold only applies to sale listings' });
    if (property.status !== 'active')
      return res.status(400).json({ error: 'Only active listings can be marked as sold' });

    await prisma.property.update({ where: { id }, data: { sold: true } });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

async function markRented(req, res, next) {
  try {
    const { id } = req.params;
    const { rentedToUserId } = req.body || {};
    const property = await prisma.property.findUnique({ where: { id } });
    if (!property) return res.status(404).json({ error: 'Property not found' });
    if (property.landlordId !== req.user.id)
      return res.status(403).json({ error: 'Not your property' });
    if (!['active', 'rented'].includes(property.status))
      return res.status(400).json({ error: 'Only active listings can be marked as rented' });

    const metadata = { ...(property.metadata || {}), ...(rentedToUserId ? { rentedToUserId } : {}) };
    await prisma.property.update({ where: { id }, data: { status: 'rented', metadata } });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

async function relistProperty(req, res, next) {
  try {
    const { id } = req.params;
    const property = await prisma.property.findUnique({ where: { id } });
    if (!property) return res.status(404).json({ error: 'Property not found' });
    if (property.landlordId !== req.user.id)
      return res.status(403).json({ error: 'Not your property' });
    if (property.status !== 'rented')
      return res.status(400).json({ error: 'Only rented listings can be relisted' });

    await prisma.property.update({ where: { id }, data: { status: 'active' } });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

async function getListings(req, res, next) {
  try {
    const { type, location, minPrice, maxPrice, bedrooms, bathrooms, propertyType, amenities, tags, page = 1, limit = 12 } = req.query;
    // Only show active listings (rented/draft/pending are hidden); exclude legacy sold flag and admin-paused listings
    const where = { status: 'active', sold: false, revokedPause: false };
    if (type) where.listingType = type;
    if (propertyType) where.propertyType = propertyType;
    if (location) where.locationGeneral = { contains: location, mode: 'insensitive' };
    if (bedrooms) where.bedrooms = { gte: parseInt(bedrooms) };
    if (bathrooms) where.bathrooms = { gte: parseInt(bathrooms) };
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }
    const andClauses = [];
    if (amenities) {
      const amenityList = amenities.split(',').map(a => a.trim()).filter(Boolean);
      amenityList.forEach(a => {
        andClauses.push({ amenities: { some: { amenityName: { equals: a, mode: 'insensitive' } } } });
      });
    }
    if (tags) {
      const tagList = tags.split(',').map(t => t.trim()).filter(Boolean);
      tagList.forEach(tag => {
        andClauses.push({ metadata: { path: ['tags'], array_contains: tag } });
      });
    }
    if (andClauses.length > 0) where.AND = andClauses;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [properties, total] = await Promise.all([
      prisma.property.findMany({
        where,
        include: {
          photos: true,
          amenities: true,
          landlord: { select: { id: true, name: true, status: true } },
        },
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.property.count({ where }),
    ]);

    const masked = properties.map(p => maskProperty(p, req.user?.role === 'tenant'));
    res.json({ properties: masked, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    next(err);
  }
}

async function getProperty(req, res, next) {
  try {
    const property = await getFullProperty(req.params.id);
    if (!property) return res.status(404).json({ error: 'Property not found' });

    const isOwner = req.user?.role === 'landlord' && req.user.id === property.landlordId;
    const isAdmin = req.user?.role === 'admin';

    // Non-active or admin-paused listings are only visible to their owner or admin
    if (property.status !== 'active' || property.sold || property.revokedPause) {
      if (!isOwner && !isAdmin) return res.status(404).json({ error: 'Property not available' });
    }

    const unlocked = req.user?.role === 'tenant' || isOwner || isAdmin;

    res.json({ property: maskProperty(property, unlocked), unlocked });
  } catch (err) {
    next(err);
  }
}

async function getLandlordProperties(req, res, next) {
  try {
    const properties = await prisma.property.findMany({
      where: { landlordId: req.user.id, sold: false },
      include: { photos: true, amenities: true, titleDocuments: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!properties.length) return res.json({ properties: [] });

    const ids = properties.map(p => p.id);
    const now = new Date();
    const day30 = new Date(now); day30.setDate(day30.getDate() - 30);

    // All-time and 30-day view sums per property
    const [viewAll, view30, msgRows] = await Promise.all([
      prisma.propertyViewSummary.groupBy({
        by: ['propertyId'],
        where: { propertyId: { in: ids } },
        _sum: { uniqueViews: true },
      }),
      prisma.propertyViewSummary.groupBy({
        by: ['propertyId'],
        where: { propertyId: { in: ids }, summaryDate: { gte: day30 } },
        _sum: { uniqueViews: true },
      }),
      // Distinct tenants per listing (non-owner)
      prisma.$queryRaw`
        SELECT property_id, COUNT(DISTINCT sender_id)::int AS cnt
        FROM messages
        WHERE property_id = ANY(${ids}::text[])
          AND sender_id != ${req.user.id}
        GROUP BY property_id
      `,
    ]);

    const viewAllMap  = Object.fromEntries(viewAll.map(r => [r.propertyId, r._sum.uniqueViews || 0]));
    const view30Map   = Object.fromEntries(view30.map(r => [r.propertyId, r._sum.uniqueViews || 0]));
    const msgMap      = Object.fromEntries(msgRows.map(r => [r.property_id, r.cnt]));

    const enriched = properties.map(p => ({
      ...p,
      stats: {
        viewsAllTime: viewAllMap[p.id] || 0,
        views30d:     view30Map[p.id]  || 0,
        messageCount: msgMap[p.id]     || 0,
      },
    }));

    res.json({ properties: enriched });
  } catch (err) {
    next(err);
  }
}

async function deleteProperty(req, res, next) {
  try {
    const { id } = req.params;
    const property = await prisma.property.findUnique({ where: { id } });
    if (!property) return res.status(404).json({ error: 'Property not found' });

    if (req.user.role !== 'admin' && property.landlordId !== req.user.id)
      return res.status(403).json({ error: 'Not your property' });

    await prisma.$transaction([
      prisma.message.deleteMany({ where: { propertyId: id } }),
      prisma.favorite.deleteMany({ where: { propertyId: id } }),
      prisma.property.delete({ where: { id } }),
    ]);

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

function maskProperty(p, unlocked) {
  // Approximate lat/lng: round to 2 decimal places (~1km precision)
  const approxLat = p.locationLat != null ? Math.round(p.locationLat * 100) / 100 : null;
  const approxLng = p.locationLng != null ? Math.round(p.locationLng * 100) / 100 : null;

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
    rentFrequency: p.rentFrequency,
    metadata: p.metadata,
    status: p.status,
    occupied: p.occupied,
    landlordVerified: p.landlord?.status === 'active',
    createdAt: p.createdAt,
    unlocked,
    approxLat,
    approxLng,
  };

  if (unlocked) {
    base.locationExact = p.locationExact;
    base.landlord = p.landlord;
    base.locationLat = p.locationLat;
    base.locationLng = p.locationLng;
  } else {
    base.locationExact = null;
    base.landlord = null;
    base.locationLat = null;
    base.locationLng = null;
  }

  return base;
}

async function getFullProperty(id) {
  return prisma.property.findUnique({
    where: { id },
    include: {
      photos: true,
      amenities: true,
      titleDocuments: true,
      landlord: { select: { id: true, name: true, status: true } },
    },
  });
}

async function tagCounts(req, res, next) {
  try {
    const rows = await prisma.$queryRaw`
      SELECT tag::text, COUNT(*)::int AS count
      FROM properties,
           jsonb_array_elements_text(COALESCE(metadata->'tags', '[]'::jsonb)) AS tag
      WHERE status = 'active' AND sold = false
      GROUP BY tag
      ORDER BY count DESC
    `;
    res.json({ counts: rows });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createProperty, updateProperty, getListings, getProperty,
  getLandlordProperties, deleteProperty, toggleOccupied, markSold, markRented, relistProperty, tagCounts,
};
