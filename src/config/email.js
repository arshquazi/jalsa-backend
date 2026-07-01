const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '465'),
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

const resortName = process.env.RESORT_NAME || 'Jalsa Hotel & Resort';
const adminEmail = process.env.ADMIN_EMAIL || 'admin@jalsaresort.com';
const fromAddress = `"${resortName}" <${process.env.EMAIL_USER}>`;

// Send to guest + notify admin
async function sendRoomBookingEmails({ booking, room }) {
  const nights = Math.ceil(
    (new Date(booking.checkOut) - new Date(booking.checkIn)) / (1000 * 60 * 60 * 24)
  );

  // Guest confirmation
  await transporter.sendMail({
    from: fromAddress,
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
  await transporter.sendMail({
    from: fromAddress,
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
  await transporter.sendMail({
    from: fromAddress,
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
  await transporter.sendMail({
    from: fromAddress,
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
  await transporter.sendMail({
    from: fromAddress,
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
  await transporter.sendMail({
    from: fromAddress,
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

module.exports = {
  transporter,
  sendRoomBookingEmails,
  sendTableReservationEmails,
  sendContactEnquiryEmail,
};
