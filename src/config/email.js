const nodemailer = require('nodemailer');

// SMTP transport — used for local development. On Railway (which blocks
// outbound SMTP on the trial plan) the Brevo HTTP API is used instead.
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const resortName = process.env.RESORT_NAME || 'Jalsa Hotel & Resort';
const adminEmail = process.env.ADMIN_EMAIL || 'admin@jalsaresort.com';
const senderEmail = process.env.EMAIL_USER || adminEmail;
const fromAddress = `"${resortName}" <${senderEmail}>`;
const BREVO_API_KEY = process.env.BREVO_API_KEY;

// Unified sender: uses Brevo's HTTP API (port 443, never blocked) when a
// BREVO_API_KEY is configured; otherwise falls back to SMTP for local dev.
async function sendMail({ to, subject, html }) {
  if (BREVO_API_KEY) {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': BREVO_API_KEY,
        'content-type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({
        sender: { name: resortName, email: senderEmail },
        to: [{ email: to }],
        subject,
        htmlContent: html,
      }),
    });
    if (!res.ok) {
      const detail = await res.text();
      throw new Error(`Brevo API ${res.status}: ${detail}`);
    }
    return res.json();
  }
  return transporter.sendMail({ from: fromAddress, to, subject, html });
}

// Send to guest + notify admin
async function sendRoomBookingEmails({ booking, room }) {
  const nights = Math.ceil(
    (new Date(booking.checkOut) - new Date(booking.checkIn)) / (1000 * 60 * 60 * 24)
  );

  // Guest confirmation
  await sendMail({
    to: booking.email,
    subject: `Booking Confirmed – ${room.name} | ${resortName}`,
    html: `
      <div style="font-family: 'Georgia', serif; color: #222; max-width: 600px; margin: auto; border: 1px solid #C8A24D; padding: 32px;">
        <h2 style="color: #154734;">Your Reservation is Confirmed ✓</h2>
        <p>Dear ${booking.firstName},</p>
        <p>Thank you for choosing <strong>${resortName}</strong>. Your booking details are below.</p>
        <table style="width:100%; border-collapse:collapse; margin: 24px 0;">
          <tr><td style="padding:8px; color:#717973;"><strong>Room</strong></td><td style="padding:8px;">${room.name}</td></tr>
          <tr style="background:#F8F5EF;"><td style="padding:8px; color:#717973;"><strong>Check-in</strong></td><td style="padding:8px;">${new Date(booking.checkIn).toDateString()}</td></tr>
          <tr><td style="padding:8px; color:#717973;"><strong>Check-out</strong></td><td style="padding:8px;">${new Date(booking.checkOut).toDateString()}</td></tr>
          <tr style="background:#F8F5EF;"><td style="padding:8px; color:#717973;"><strong>Guests</strong></td><td style="padding:8px;">${booking.guests}</td></tr>
          <tr><td style="padding:8px; color:#717973;"><strong>Duration</strong></td><td style="padding:8px;">${nights} night(s)</td></tr>
          <tr style="background:#F8F5EF;"><td style="padding:8px; color:#717973;"><strong>Total</strong></td><td style="padding:8px; color:#154734; font-weight:bold;">₹${booking.totalAmount.toLocaleString('en-IN')}</td></tr>
        </table>
        ${booking.specialRequests ? `<p><strong>Special Requests:</strong> ${booking.specialRequests}</p>` : ''}
        <p>For queries, call us at <strong>${process.env.RESORT_PHONE}</strong> or reply to this email.</p>
        <p style="color:#C8A24D; margin-top:32px;">— The ${resortName} Team</p>
      </div>
    `,
  });

  // Admin notification
  await sendMail({
    to: adminEmail,
    subject: `New Room Booking #${booking.id} – ${room.name}`,
    html: `
      <p><strong>New booking received:</strong></p>
      <p>Guest: ${booking.firstName} ${booking.lastName} (${booking.email} / ${booking.phone})</p>
      <p>Room: ${room.name}</p>
      <p>Check-in: ${new Date(booking.checkIn).toDateString()} → Check-out: ${new Date(booking.checkOut).toDateString()}</p>
      <p>Guests: ${booking.guests} | Total: ₹${booking.totalAmount.toLocaleString('en-IN')}</p>
    `,
  });
}

async function sendTableReservationEmails({ reservation }) {
  // Guest confirmation
  await sendMail({
    to: reservation.email,
    subject: `Table Reservation Confirmed | ${resortName}`,
    html: `
      <div style="font-family: 'Georgia', serif; color: #222; max-width: 600px; margin: auto; border: 1px solid #C8A24D; padding: 32px;">
        <h2 style="color: #154734;">Your Table is Reserved ✓</h2>
        <p>Dear ${reservation.name},</p>
        <p>We look forward to welcoming you at <strong>${resortName}</strong>.</p>
        <table style="width:100%; border-collapse:collapse; margin: 24px 0;">
          <tr><td style="padding:8px; color:#717973;"><strong>Date</strong></td><td style="padding:8px;">${new Date(reservation.date).toDateString()}</td></tr>
          <tr style="background:#F8F5EF;"><td style="padding:8px; color:#717973;"><strong>Time</strong></td><td style="padding:8px;">${reservation.time}</td></tr>
          <tr><td style="padding:8px; color:#717973;"><strong>Party Size</strong></td><td style="padding:8px;">${reservation.partySize} guest(s)</td></tr>
          ${reservation.occasion ? `<tr style="background:#F8F5EF;"><td style="padding:8px; color:#717973;"><strong>Occasion</strong></td><td style="padding:8px;">${reservation.occasion}</td></tr>` : ''}
        </table>
        <p>Please arrive 10 minutes before your reservation time. Call <strong>${process.env.RESORT_PHONE}</strong> to modify or cancel.</p>
        <p style="color:#C8A24D; margin-top:32px;">— The ${resortName} Team</p>
      </div>
    `,
  });

  // Admin notification
  await sendMail({
    to: adminEmail,
    subject: `New Table Reservation – ${reservation.name} (${reservation.partySize} pax)`,
    html: `
      <p><strong>New table reservation:</strong></p>
      <p>Guest: ${reservation.name} (${reservation.email} / ${reservation.phone})</p>
      <p>Date: ${new Date(reservation.date).toDateString()} at ${reservation.time}</p>
      <p>Party size: ${reservation.partySize}${reservation.occasion ? ` | Occasion: ${reservation.occasion}` : ''}</p>
    `,
  });
}

async function sendContactEnquiryEmail({ enquiry }) {
  await sendMail({
    to: adminEmail,
    subject: `New Enquiry: ${enquiry.subject} – ${enquiry.name}`,
    html: `
      <p><strong>New contact enquiry from website:</strong></p>
      <p>Name: ${enquiry.name}</p>
      <p>Email: ${enquiry.email}${enquiry.phone ? ` | Phone: ${enquiry.phone}` : ''}</p>
      <p>Subject: ${enquiry.subject}</p>
      <hr>
      <p>${enquiry.message}</p>
    `,
  });

  // Auto-reply to guest
  await sendMail({
    to: enquiry.email,
    subject: `We received your message | ${resortName}`,
    html: `
      <div style="font-family: 'Georgia', serif; color: #222; max-width: 600px; margin: auto; border: 1px solid #C8A24D; padding: 32px;">
        <h2 style="color: #154734;">Thank you for reaching out</h2>
        <p>Dear ${enquiry.name},</p>
        <p>We have received your enquiry and will get back to you within 24 hours.</p>
        <p style="color:#C8A24D; margin-top:32px;">— The ${resortName} Team</p>
      </div>
    `,
  });
}

// Diagnostic: send a live test email through the active provider and return the result.
async function runEmailDiagnostic(toOverride) {
  const to = toOverride || adminEmail;
  const result = {
    provider: BREVO_API_KEY ? 'Brevo HTTP API' : 'Gmail SMTP',
    config: {
      senderEmail,
      adminEmail,
      brevoKeySet: !!BREVO_API_KEY,
      smtpUser: process.env.EMAIL_USER || '(missing)',
      smtpPassSet: !!process.env.EMAIL_PASS,
    },
    send: null,
  };

  try {
    await sendMail({
      to,
      subject: 'Jalsa Resort — Email Diagnostic Test',
      html: '<p>This is a live test from your Railway server. If you received this, email notifications are working. ✅</p>',
    });
    result.send = `OK — sent to ${to}`;
  } catch (e) {
    result.send = `FAILED — ${e.message}`;
  }

  return result;
}

module.exports = {
  transporter,
  sendRoomBookingEmails,
  sendTableReservationEmails,
  sendContactEnquiryEmail,
  runEmailDiagnostic,
};
