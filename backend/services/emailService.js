const nodemailer = require('nodemailer');

// Configure email transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Generate HTML membership card
const generateMembershipCardHTML = (userData) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body {
                font-family: 'Arial', sans-serif;
                margin: 0;
                padding: 20px;
                background-color: #f5f5f5;
            }
            .card-container {
                max-width: 600px;
                margin: 0 auto;
                background-color: white;
                border-radius: 15px;
                overflow: hidden;
                box-shadow: 0 10px 25px rgba(0,0,0,0.1);
            }
            .header {
                background: linear-gradient(135deg, #1B2951 0%, #2D5016 100%);
                color: white;
                padding: 30px;
                text-align: center;
            }
            .logo-text {
                font-size: 28px;
                font-weight: bold;
                margin-bottom: 10px;
                letter-spacing: 2px;
            }
            .subtitle {
                font-size: 16px;
                opacity: 0.9;
                margin-bottom: 5px;
            }
            .card-type {
                font-size: 14px;
                opacity: 0.8;
                background-color: rgba(255,255,255,0.2);
                padding: 5px 15px;
                border-radius: 15px;
                display: inline-block;
                margin-top: 10px;
            }
            .member-info {
                padding: 30px;
                background-color: white;
            }
            .member-row {
                display: flex;
                margin-bottom: 15px;
                border-bottom: 1px solid #f0f0f0;
                padding-bottom: 10px;
            }
            .member-row:last-child {
                border-bottom: none;
                margin-bottom: 0;
            }
            .label {
                font-weight: bold;
                color: #1B2951;
                width: 140px;
                font-size: 14px;
            }
            .value {
                color: #333;
                flex: 1;
                font-size: 14px;
            }
            .membership-id {
                background-color: #E8F5E8;
                color: #2D5016;
                font-weight: bold;
                padding: 8px 15px;
                border-radius: 8px;
                font-family: monospace;
                letter-spacing: 1px;
            }
            .qr-section {
                text-align: center;
                padding: 20px;
                background-color: #f8f9fa;
                border-top: 2px solid #2D5016;
            }
            .qr-title {
                font-size: 16px;
                font-weight: bold;
                color: #1B2951;
                margin-bottom: 15px;
            }
            .qr-note {
                font-size: 12px;
                color: #666;
                margin-top: 15px;
                font-style: italic;
            }
            .footer {
                background-color: #1B2951;
                color: white;
                padding: 20px;
                text-align: center;
            }
            .footer-text {
                font-size: 14px;
                margin-bottom: 10px;
            }
            .contact-info {
                font-size: 12px;
                opacity: 0.8;
                line-height: 1.5;
            }
            .welcome-message {
                background-color: #E8F5E8;
                border-left: 4px solid #2D5016;
                padding: 20px;
                margin: 20px 0;
                font-size: 16px;
                line-height: 1.6;
                color: #2D5016;
            }
        </style>
    </head>
    <body>
        <div class="card-container">
            <!-- Header -->
            <div class="header">
                <div class="logo-text">GORKHA JANSHAKTI FRONT</div>
                <div class="subtitle">गोर्खा जनशक्ति फ्रन्ट</div>
                <div class="card-type">OFFICIAL MEMBERSHIP CARD</div>
            </div>

            <!-- Welcome Message -->
            <div class="welcome-message">
                <strong>Welcome to Gorkha Janshakti Front!</strong><br>
                We are honored to have you as a member of our movement. Your membership represents our collective strength in serving the Gorkha community.
            </div>

            <!-- Member Information -->
            <div class="member-info">
                <div class="member-row">
                    <div class="label">Full Name:</div>
                    <div class="value">${userData.fullName}</div>
                </div>
                <div class="member-row">
                    <div class="label">Father's Name:</div>
                    <div class="value">${userData.fatherName}</div>
                </div>
                <div class="member-row">
                    <div class="label">Membership ID:</div>
                    <div class="value">
                        <span class="membership-id">${userData.membershipId}</span>
                    </div>
                </div>
                <div class="member-row">
                    <div class="label">Phone:</div>
                    <div class="value">${userData.phone}</div>
                </div>
                <div class="member-row">
                    <div class="label">Email:</div>
                    <div class="value">${userData.email}</div>
                </div>
                <div class="member-row">
                    <div class="label">Constituency:</div>
                    <div class="value">${userData.constituency || 'Not specified'}</div>
                </div>
                <div class="member-row">
                    <div class="label">Member Since:</div>
                    <div class="value">${new Date().toLocaleDateString('en-IN')}</div>
                </div>
                <div class="member-row">
                    <div class="label">Status:</div>
                    <div class="value" style="color: #2D5016; font-weight: bold;">ACTIVE MEMBER</div>
                </div>
            </div>

            <!-- QR Code Section -->
            <div class="qr-section">
                <div class="qr-title">Verification QR Code</div>
                <div style="margin: 15px 0;">
                    <div style="background-color: white; padding: 10px; border-radius: 8px; display: inline-block;">
                        QR Code: ${userData.membershipId}
                    </div>
                </div>
                <div class="qr-note">
                    Use the mobile app to access your QR code for instant verification.
                </div>
            </div>

            <!-- Footer -->
            <div class="footer">
                <div class="footer-text">Thank you for joining our movement!</div>
                <div class="contact-info">
                    Party Headquarters<br>
                    Phone: +91-1234567890<br>
                    Email: contact@gorkhajanshakti.org
                </div>
            </div>
        </div>
    </body>
    </html>
  `;
};

// Send membership card email
const sendMembershipCard = async (userData) => {
  try {
    const membershipCardHTML = generateMembershipCardHTML(userData);

    const mailOptions = {
      from: {
        name: 'Gorkha Janshakti Front',
        address: process.env.EMAIL_USER
      },
      to: userData.email,
      subject: `Welcome to Gorkha Janshakti Front - Membership ID: ${userData.membershipId}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #1B2951;">Welcome to Gorkha Janshakti Front!</h1>
          
          <p>Dear <strong>${userData.fullName}</strong>,</p>
          
          <p>Congratulations! Your membership registration has been successfully completed.</p>
          
          <div style="background-color: #E8F5E8; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #2D5016; margin-top: 0;">Your Membership Details:</h3>
            <ul style="color: #2D5016;">
              <li><strong>Membership ID:</strong> ${userData.membershipId}</li>
              <li><strong>Registration Date:</strong> ${new Date().toLocaleDateString('en-IN')}</li>
              <li><strong>Status:</strong> Active Member</li>
            </ul>
          </div>

          <p>Your detailed membership card is below:</p>

          ${membershipCardHTML}

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
            <p>Best regards,<br>
            <strong>Gorkha Janshakti Front</strong><br>
            Membership Committee</p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log('Membership card email sent successfully to:', userData.email);
    return { success: true };
  } catch (error) {
    console.error('Error sending membership card email:', error);
    return { success: false, error: error.message };
  }
};

// Send role update email
const sendRoleUpdateEmail = async (userData, newRole) => {
  try {
    const roleNames = {
      member: 'Member',
      organizer: 'Organizer',
      admin: 'Administrator'
    };

    const mailOptions = {
      from: {
        name: 'Gorkha Janshakti Front',
        address: process.env.EMAIL_USER
      },
      to: userData.email,
      subject: `Role Updated - You are now an ${roleNames[newRole]}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #1B2951;">Role Update Notification</h1>
          
          <p>Dear <strong>${userData.name}</strong>,</p>
          
          <p>Your role in Gorkha Janshakti Front has been updated.</p>
          
          <div style="background-color: #E8F5E8; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <h2 style="color: #2D5016; margin-top: 0;">New Role: ${roleNames[newRole]}</h2>
          </div>

          <p>Please log into the mobile app to access your new features.</p>

          <p>Best regards,<br>
          <strong>Gorkha Janshakti Front</strong><br>
          Administration Team</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log('Role update email sent successfully to:', userData.email);
    return { success: true };
  } catch (error) {
    console.error('Error sending role update email:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendMembershipCard,
  sendRoleUpdateEmail,
};