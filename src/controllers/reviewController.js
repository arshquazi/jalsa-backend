const prisma = require('../config/database');

// GET /api/reviews — approved reviews only (public)
async function getReviews(req, res) {
  try {
    const reviews = await prisma.review.findMany({
      where: { approved: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(reviews);
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
}

// POST /api/reviews — submit a review (pending approval)
async function submitReview(req, res) {
  const { name, email, rating, title, body } = req.body;
  try {
    await prisma.review.create({
      data: { name, email, rating: parseInt(rating), title, body, approved: false },
    });
    res.status(201).json({ message: 'Review submitted and awaiting approval. Thank you!' });
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
}

// ── Admin ───────────────────────────────────────────────────────

async function adminListReviews(req, res) {
  try {
    const reviews = await prisma.review.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(reviews);
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
}

async function adminApproveReview(req, res) {
  try {
    const review = await prisma.review.update({
      where: { id: parseInt(req.params.id) },
      data: { approved: true },
    });
    res.json(review);
  } catch {
    res.status(404).json({ error: 'Review not found' });
  }
}

async function adminDeleteReview(req, res) {
  try {
    await prisma.review.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Review deleted' });
  } catch {
    res.status(404).json({ error: 'Review not found' });
  }
}

module.exports = { getReviews, submitReview, adminListReviews, adminApproveReview, adminDeleteReview };
