const prisma = require('../config/database');

// GET /api/menu — full menu grouped by category
async function getMenu(req, res) {
  try {
    const categories = await prisma.menuCategory.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        items: {
          where: { isAvailable: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
    res.json(categories);
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
}

// ── Admin ───────────────────────────────────────────────────────

async function adminGetMenu(req, res) {
  try {
    const categories = await prisma.menuCategory.findMany({
      orderBy: { sortOrder: 'asc' },
      include: { items: { orderBy: { sortOrder: 'asc' } } },
    });
    res.json(categories);
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
}

async function adminCreateItem(req, res) {
  const { categoryId, name, description, price, image, isVeg, sortOrder } = req.body;
  try {
    const item = await prisma.menuItem.create({
      data: {
        categoryId: parseInt(categoryId),
        name,
        description,
        price: parseFloat(price),
        image,
        isVeg: isVeg !== false,
        sortOrder: parseInt(sortOrder || 0),
      },
    });
    res.status(201).json(item);
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
}

async function adminUpdateItem(req, res) {
  const { name, description, price, image, isVeg, isAvailable, sortOrder, categoryId } = req.body;
  try {
    const item = await prisma.menuItem.update({
      where: { id: parseInt(req.params.id) },
      data: {
        name,
        description,
        price: price ? parseFloat(price) : undefined,
        image,
        isVeg,
        isAvailable,
        sortOrder: sortOrder !== undefined ? parseInt(sortOrder) : undefined,
        categoryId: categoryId ? parseInt(categoryId) : undefined,
      },
    });
    res.json(item);
  } catch {
    res.status(404).json({ error: 'Item not found' });
  }
}

async function adminDeleteItem(req, res) {
  try {
    await prisma.menuItem.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Item deleted' });
  } catch {
    res.status(404).json({ error: 'Item not found' });
  }
}

async function adminCreateCategory(req, res) {
  const { name, sortOrder } = req.body;
  try {
    const cat = await prisma.menuCategory.create({ data: { name, sortOrder: parseInt(sortOrder || 0) } });
    res.status(201).json(cat);
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
}

module.exports = { getMenu, adminGetMenu, adminCreateItem, adminUpdateItem, adminDeleteItem, adminCreateCategory };
