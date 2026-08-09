const { sendContactInquiryEmail } = require('../services/email.service');
const { successResponse } = require('../utils/response');
const AppError = require('../utils/errors');

/**
 * POST /api/contact
 * Handle Contact Us form submission
 */
const submitContactForm = async (req, res, next) => {
  try {
    const { firstName, lastName, email, phone, category, subject, message } = req.body;

    if (!firstName || !lastName || !email || !subject || !message) {
      throw new AppError('First name, last name, email, subject, and message are required', 400);
    }

    const ticketId = `TKT-${Math.floor(100000 + Math.random() * 900000)}`;

    const mailResult = await sendContactInquiryEmail({
      firstName,
      lastName,
      email,
      phone,
      category: category || 'General Inquiry',
      subject,
      message,
      ticketId,
    });

    return successResponse(res, 200, 'Inquiry submitted successfully', {
      ticketId,
      emailSent: !mailResult.simulated,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  submitContactForm,
};
