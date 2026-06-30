const prisma = require('../config/database');

// POST /api/newsletter
async function subscribe(req, res) {
  const { email, name } = req.body;
  try {
    await prisma.newsletterSubscriber.upsert({
      where: { email },
      update: { name },
      create: { email, name },
    });
    res.status(201).json({ message: 'You have been subscribed to our newsletter.' });
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
}

// ── Admin ───────────────────────────────────────────────────────

async function adminListSubscribers(req, res) {
  try {
    const subs = await prisma.newsletterSubscriber.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(subs);
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
}

async function adminDeleteSubscriber(req, res) {
  try {
    await prisma.newsletterSubscriber.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Unsubscribed' });
  } catch {
    res.status(404).json({ error: 'Subscriber not found' });
  }
}

module.exports = { subscribe, adminListSubscribers, adminDeleteSubscriber };
