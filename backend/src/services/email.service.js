const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config();

const createTransporter = () => {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user,
      pass,
    },
  });
};

const sendMailWithFallback = async (mailOptions, emailType) => {
  const transporter = createTransporter();

  if (!transporter) {
    console.log(`[EMAIL SERVICE: SIMULATED] (${emailType}) -> To: ${mailOptions.to} | Subject: "${mailOptions.subject}"`);
    return { success: true, simulated: true };
  }

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[EMAIL SERVICE: SENT] (${emailType}) -> To: ${mailOptions.to} | MessageId: ${info.messageId}`);
    return { success: true, simulated: false, info };
  } catch (error) {
    console.warn(`[EMAIL SERVICE: FALLBACK] Failed to send real email (${emailType}):`, error.message);
    console.log(`[EMAIL SERVICE: SIMULATED] (${emailType}) -> To: ${mailOptions.to} | Subject: "${mailOptions.subject}"`);
    return { success: true, simulated: true };
  }
};

const sendPasswordResetEmail = async (toEmail, resetToken, userName = 'User') => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

  const mailOptions = {
    from: `"Odoo Rentals" <${process.env.GMAIL_USER || 'noreply@rental.com'}>`,
    to: toEmail,
    subject: 'Password Reset Request — Odoo Rentals',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #CD2C58; text-align: center;">Odoo Rentals</h2>
        <hr style="border: none; border-top: 1px solid #e2e8f0;" />
        <p>Hello <strong>${userName}</strong>,</p>
        <p>We received a request to reset your password. Use the password reset token below or click the button to reset your password:</p>
        <div style="background-color: #f1f5f9; padding: 15px; text-align: center; border-radius: 6px; font-family: monospace; font-size: 18px; font-weight: bold; color: #0f172a; margin: 20px 0;">
          ${resetToken}
        </div>
        <div style="text-align: center; margin: 25px 0;">
          <a href="${resetUrl}" style="background-color: #CD2C58; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Reset Password</a>
        </div>
        <p style="color: #64748b; font-size: 14px;">This password reset token will expire in 15 minutes.</p>
      </div>
    `,
  };

  return await sendMailWithFallback(mailOptions, 'PasswordReset');
};

const sendQuotationEmail = async (order, toEmail, customerName = 'Customer') => {
  const mailOptions = {
    from: `"Odoo Rentals" <${process.env.GMAIL_USER || 'noreply@rental.com'}>`,
    to: toEmail,
    subject: `Rental Quotation #${order.order_number} — Odoo Rentals`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #CD2C58; text-align: center;">Rental Quotation Proposal</h2>
        <p>Hello <strong>${customerName}</strong>,</p>
        <p>Thank you for inquiring with Odoo Rentals! Please find your official rental quotation below:</p>
        
        <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; margin: 15px 0;">
          <p style="margin: 5px 0;"><strong>Quotation #:</strong> ${order.order_number}</p>
          <p style="margin: 5px 0;"><strong>Rental Dates:</strong> ${order.start_date} to ${order.end_date}</p>
          <p style="margin: 5px 0;"><strong>Total Amount:</strong> ₹${order.subtotal}</p>
        </div>

        <p>To confirm this quotation into an active rental order, please review and reply to this email or visit your portal dashboard.</p>
        <p style="font-size: 12px; color: #64748b; margin-top: 30px;">Odoo Rentals Team</p>
      </div>
    `,
  };

  return await sendMailWithFallback(mailOptions, 'RentalQuotation');
};

const sendOrderConfirmationEmail = async (order, toEmail, customerName = 'Customer') => {
  const mailOptions = {
    from: `"Odoo Rentals" <${process.env.GMAIL_USER || 'noreply@rental.com'}>`,
    to: toEmail,
    subject: `Rental Order Confirmed #${order.order_number} — Odoo Rentals`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #10b981; text-align: center;">Rental Order Confirmed!</h2>
        <p>Hello <strong>${customerName}</strong>,</p>
        <p>Great news! Your rental order <strong>#${order.order_number}</strong> has been officially confirmed (Sale Order).</p>
        
        <div style="background-color: #ecfdf5; padding: 15px; border-radius: 6px; margin: 15px 0; border: 1px solid #a7f3d0;">
          <p style="margin: 5px 0;"><strong>Order Status:</strong> CONFIRMED (SALE ORDER)</p>
          <p style="margin: 5px 0;"><strong>Pickup Date:</strong> ${order.start_date}</p>
          <p style="margin: 5px 0;"><strong>Return Date:</strong> ${order.end_date}</p>
          <p style="margin: 5px 0;"><strong>Total Reserved Amount:</strong> ₹${order.subtotal}</p>
        </div>

        <p>Our team is preparing your equipment for pickup/delivery on ${order.start_date}.</p>
        <p style="font-size: 12px; color: #64748b; margin-top: 30px;">Odoo Rentals Team</p>
      </div>
    `,
  };

  return await sendMailWithFallback(mailOptions, 'OrderConfirmation');
};

const sendInvoiceNotificationEmail = async (invoice, order, toEmail, customerName = 'Customer') => {
  const mailOptions = {
    from: `"Odoo Rentals" <${process.env.GMAIL_USER || 'noreply@rental.com'}>`,
    to: toEmail,
    subject: `Rental Invoice ${invoice.invoice_number} — Odoo Rentals`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #6366f1; text-align: center;">Invoice Issued</h2>
        <p>Hello <strong>${customerName}</strong>,</p>
        <p>An official invoice has been generated for your rental order <strong>#${order?.order_number || invoice.order_id}</strong>.</p>
        
        <div style="background-color: #f5f3ff; padding: 15px; border-radius: 6px; margin: 15px 0; border: 1px solid #ddd6fe;">
          <p style="margin: 5px 0;"><strong>Invoice Number:</strong> ${invoice.invoice_number}</p>
          <p style="margin: 5px 0;"><strong>Invoice Status:</strong> ${invoice.status}</p>
          <p style="margin: 5px 0;"><strong>Payment Status:</strong> ${invoice.payment_status}</p>
          <p style="margin: 5px 0;"><strong>Billed Amount:</strong> ₹${invoice.amount}</p>
        </div>

        <p>Thank you for choosing Odoo Rentals!</p>
      </div>
    `,
  };

  return await sendMailWithFallback(mailOptions, 'InvoiceNotification');
};

const sendPickupReminderEmail = async (order, toEmail, customerName = 'Customer') => {
  const mailOptions = {
    from: `"Odoo Rentals" <${process.env.GMAIL_USER || 'noreply@rental.com'}>`,
    to: toEmail,
    subject: `Upcoming Rental Pickup Reminder #${order.order_number} — Odoo Rentals`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #2563eb; text-align: center;">Pickup Reminder</h2>
        <p>Hello <strong>${customerName}</strong>,</p>
        <p>This is a quick reminder that your rental equipment order <strong>#${order.order_number}</strong> is scheduled for pickup on <strong>${order.start_date}</strong>.</p>
        <p>Please remember to bring your government ID and order confirmation code.</p>
      </div>
    `,
  };

  return await sendMailWithFallback(mailOptions, 'PickupReminder');
};

const sendReturnReminderEmail = async (order, toEmail, customerName = 'Customer') => {
  const mailOptions = {
    from: `"Odoo Rentals" <${process.env.GMAIL_USER || 'noreply@rental.com'}>`,
    to: toEmail,
    subject: `Rental Equipment Return Reminder #${order.order_number} — Odoo Rentals`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #d97706; text-align: center;">Equipment Return Reminder</h2>
        <p>Hello <strong>${customerName}</strong>,</p>
        <p>Your rental period for order <strong>#${order.order_number}</strong> is ending on <strong>${order.end_date}</strong>.</p>
        <p>Please ensure all items and accessories are returned on time to avoid automated late fee charges.</p>
      </div>
    `,
  };

  return await sendMailWithFallback(mailOptions, 'ReturnReminder');
};

const sendContactInquiryEmail = async (contactData) => {
  const { firstName, lastName, email, phone, category, subject, message, ticketId } = contactData;
  const adminEmail = process.env.GMAIL_USER || 'support@odoorentals.com';

  // 1. Email to Support Team / Admin
  const adminMailOptions = {
    from: `"Odoo Rentals Contact" <${process.env.GMAIL_USER || 'noreply@rental.com'}>`,
    to: adminEmail,
    subject: `[${ticketId}] ${category}: ${subject}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #CD2C58; text-align: center;">New Customer Inquiry</h2>
        <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; margin: 15px 0;">
          <p style="margin: 5px 0;"><strong>Ticket Ref:</strong> ${ticketId}</p>
          <p style="margin: 5px 0;"><strong>From:</strong> ${firstName} ${lastName} (&lt;${email}&gt;)</p>
          <p style="margin: 5px 0;"><strong>Phone:</strong> ${phone || 'N/A'}</p>
          <p style="margin: 5px 0;"><strong>Category:</strong> ${category}</p>
          <p style="margin: 5px 0;"><strong>Subject:</strong> ${subject}</p>
        </div>
        <div style="padding: 15px; background-color: #ffffff; border-left: 4px solid #CD2C58; margin: 15px 0;">
          <p style="margin: 0; white-space: pre-wrap; font-size: 14px; color: #334155;">${message}</p>
        </div>
      </div>
    `,
  };

  // 2. Auto-reply confirmation to Customer
  const customerMailOptions = {
    from: `"Odoo Rentals Support" <${process.env.GMAIL_USER || 'support@odoorentals.com'}>`,
    to: email,
    subject: `Inquiry Received [${ticketId}] — Odoo Rentals Support`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #CD2C58; text-align: center;">Thank You for Contacting Us!</h2>
        <p>Hello <strong>${firstName}</strong>,</p>
        <p>We have received your support request. Our team is reviewing it and will respond shortly.</p>
        
        <div style="background-color: #f1f5f9; padding: 15px; border-radius: 6px; margin: 15px 0;">
          <p style="margin: 5px 0;"><strong>Ticket Reference:</strong> <span style="font-family: monospace; font-size: 16px; color: #CD2C58; font-weight: bold;">${ticketId}</span></p>
          <p style="margin: 5px 0;"><strong>Category:</strong> ${category}</p>
          <p style="margin: 5px 0;"><strong>Subject:</strong> ${subject}</p>
        </div>

        <p style="font-size: 13px; color: #64748b;">If you have additional details to add, please reply directly to this email with reference <strong>${ticketId}</strong>.</p>
        <p style="font-size: 12px; color: #94a3b8; margin-top: 30px;">Odoo Rentals Support Team</p>
      </div>
    `,
  };

  const adminResult = await sendMailWithFallback(adminMailOptions, 'ContactInquiryAdmin');
  await sendMailWithFallback(customerMailOptions, 'ContactInquiryCustomer');
  return adminResult;
};

module.exports = {
  sendPasswordResetEmail,
  sendQuotationEmail,
  sendOrderConfirmationEmail,
  sendInvoiceNotificationEmail,
  sendPickupReminderEmail,
  sendReturnReminderEmail,
  sendContactInquiryEmail,
};
