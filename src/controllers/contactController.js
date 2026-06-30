const prisma = require('../config/database');
const { sendContactEnquiryEmail } = require('../config/email');

// POST /api/contact
async function submitEnquiry(req, res) {
  const { name, email, phone, subject, message } = req.body;
  try {
    const enquiry = await prisma.contactEnquiry.create({
      data: { name, email, phone, subject, message },
    });

    sendContactEnquiryEmail({ enquiry }).catch((e) =>
      console.error('Email send failed:', e.message)
    );

    res.status(201).json({ message: 'Your enquiry has been received. We will get back to you within 24 hours.' });
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
}

// ── Admin ───────────────────────────────────────────────────────

async function adminListEnquiries(req, res) {
  try {
    const enquiries = await prisma.contactEnquiry.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(enquiries);
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
}

async function adminMarkRead(req, res) {
  try {
    const enquiry = await prisma.contactEnquiry.update({
      where: { id: parseInt(req.params.id) },
      data: { read: true },
    });
    res.json(enquiry);
  } catch {
    res.status(404).json({ error: 'Enquiry not found' });
  }
}

async function adminDeleteEnquiry(req, res) {
  try {
    await prisma.contactEnquiry.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Deleted' });
  } catch {
    res.status(404).json({ error: 'Enquiry not found' });
  }
}

module.exports = { submitEnquiry, adminListEnquiries, adminMarkRead, adminDeleteEnquiry };
