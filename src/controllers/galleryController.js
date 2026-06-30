const prisma = require('../config/database');

// GET /api/gallery?category=rooms
async function getGallery(req, res) {
  const { category } = req.query;
  try {
    const images = await prisma.galleryImage.findMany({
      where: { isActive: true, ...(category ? { category } : {}) },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });
    res.json(images);
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
}

async function adminListImages(req, res) {
  try {
    const images = await prisma.galleryImage.findMany({ orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }] });
    res.json(images);
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
}

async function adminCreateImage(req, res) {
  const { url, caption, category, sortOrder } = req.body;
  try {
    const img = await prisma.galleryImage.create({
      data: { url, caption, category: category || 'general', sortOrder: parseInt(sortOrder || 0) },
    });
    res.status(201).json(img);
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
}

async function adminUpdateImage(req, res) {
  const { url, caption, category, sortOrder, isActive } = req.body;
  try {
    const img = await prisma.galleryImage.update({
      where: { id: parseInt(req.params.id) },
      data: { url, caption, category, sortOrder: sortOrder !== undefined ? parseInt(sortOrder) : undefined, isActive },
    });
    res.json(img);
  } catch {
    res.status(404).json({ error: 'Image not found' });
  }
}

async function adminDeleteImage(req, res) {
  try {
    await prisma.galleryImage.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Image deleted' });
  } catch {
    res.status(404).json({ error: 'Image not found' });
  }
}

module.exports = { getGallery, adminListImages, adminCreateImage, adminUpdateImage, adminDeleteImage };
