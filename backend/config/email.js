const nodemailer = require('nodemailer');

// Create transporter (using Gmail as example - you can use any service)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // Use App Password for Gmail
  },
});

// Verify connection configuration
transporter.verify((error, success) => {
  if (error) {
    console.log('❌ Email configuration error:', error);
  } else {
    console.log('✅ Email server is ready to send messages');
  }
});

// Email templates
const emailTemplates = {
  newReport: (report, adminEmails) => ({
    from: `"Community Connect" <${process.env.EMAIL_USER}>`,
    to: adminEmails.join(', '),
    subject: `🚨 New Report: ${report.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">
          New Community Report Submitted
        </h2>
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #1e293b; margin-top: 0;">${report.title}</h3>
          
          <div style="margin: 15px 0;">
            <strong>📝 Description:</strong>
            <p style="margin: 5px 0; color: #475569;">${report.description}</p>
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 15px 0;">
            <div>
              <strong>📂 Category:</strong>
              <div style="color: #475569;">${report.category}</div>
            </div>
            <div>
              <strong>📍 Location:</strong>
              <div style="color: #475569;">${report.location.address}</div>
            </div>
            <div>
              <strong>👤 Submitted By:</strong>
              <div style="color: #475569;">${report.createdBy.username}</div>
            </div>
            <div>
              <strong>📅 Submitted On:</strong>
              <div style="color: #475569;">${new Date(report.createdAt).toLocaleDateString()}</div>
            </div>
          </div>
          
          ${report.images.length > 0 ? `
            <div style="margin: 15px 0;">
              <strong>🖼️ Images:</strong>
              <div style="color: #475569;">${report.images.length} image(s) attached</div>
            </div>
          ` : ''}
        </div>
        
        <div style="text-align: center; margin: 25px 0;">
          <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/reports/${report._id}" 
             style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            👀 View Report Details
          </a>
        </div>
        
        <div style="border-top: 1px solid #e2e8f0; padding-top: 15px; color: #64748b; font-size: 14px;">
          <p>This is an automated notification from Community Connect.</p>
          <p>Please do not reply to this email.</p>
        </div>
      </div>
    `
  }),

  statusUpdate: (report, oldStatus, newStatus) => ({
    from: `"Community Connect" <${process.env.EMAIL_USER}>`,
    to: report.createdBy.email,
    subject: `📋 Report Update: ${report.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">
          Your Report Status Has Been Updated
        </h2>
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #1e293b; margin-top: 0;">${report.title}</h3>
          
          <div style="text-align: center; margin: 20px 0;">
            <div style="display: inline-block; background: white; padding: 15px 25px; border-radius: 8px; border: 1px solid #e2e8f0;">
              <div style="font-size: 12px; color: #64748b; margin-bottom: 5px;">STATUS CHANGED</div>
              <div style="display: flex; align-items: center; gap: 10px;">
                <span style="padding: 4px 8px; background: #f1f5f9; border-radius: 4px; font-size: 12px;">${oldStatus}</span>
                <span style="color: #64748b;">→</span>
                <span style="padding: 4px 8px; background: #dbeafe; color: #2563eb; border-radius: 4px; font-size: 12px; font-weight: bold;">${newStatus}</span>
              </div>
            </div>
          </div>
          
          <div style="margin: 15px 0;">
            <strong>📍 Location:</strong>
            <div style="color: #475569;">${report.location.address}</div>
          </div>
          
          ${report.assignedTo ? `
            <div style="margin: 15px 0;">
              <strong>👤 Assigned To:</strong>
              <div style="color: #475569;">${report.assignedTo.username}</div>
            </div>
          ` : ''}
        </div>
        
        <div style="text-align: center; margin: 25px 0;">
          <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/reports/${report._id}" 
             style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            📋 View Updated Report
          </a>
        </div>
        
        <div style="border-top: 1px solid #e2e8f0; padding-top: 15px; color: #64748b; font-size: 14px;">
          <p>Thank you for helping improve our community!</p>
          <p>This is an automated notification from Community Connect.</p>
        </div>
      </div>
    `
  }),

  reportResolved: (report) => ({
    from: `"Community Connect" <${process.env.EMAIL_USER}>`,
    to: report.createdBy.email,
    subject: `✅ Report Resolved: ${report.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10b981; border-bottom: 2px solid #10b981; padding-bottom: 10px;">
          Your Report Has Been Resolved! 🎉
        </h2>
        
        <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #bbf7d0;">
          <h3 style="color: #1e293b; margin-top: 0;">${report.title}</h3>
          
          <div style="text-align: center; margin: 20px 0;">
            <div style="display: inline-block; background: #dcfce7; color: #166534; padding: 15px 25px; border-radius: 8px; font-weight: bold;">
              ✅ ISSUE RESOLVED
            </div>
          </div>
          
          <div style="margin: 15px 0;">
            <strong>📍 Location:</strong>
            <div style="color: #475569;">${report.location.address}</div>
          </div>
          
          <div style="margin: 15px 0;">
            <strong>📅 Submitted On:</strong>
            <div style="color: #475569;">${new Date(report.createdAt).toLocaleDateString()}</div>
          </div>
          
          <div style="margin: 15px 0;">
            <strong>📅 Resolved On:</strong>
            <div style="color: #475569;">${new Date().toLocaleDateString()}</div>
          </div>
        </div>
        
        <div style="text-align: center; margin: 25px 0;">
          <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/reports/${report._id}" 
             style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            📋 View Resolved Report
          </a>
        </div>
        
        <div style="border-top: 1px solid #e2e8f0; padding-top: 15px; color: #64748b; font-size: 14px; text-align: center;">
          <p><strong>Thank you for your contribution to our community!</strong></p>
          <p>Your report helped make our neighborhood a better place.</p>
          <p>This is an automated notification from Community Connect.</p>
        </div>
      </div>
    `
  })
};

// Email sending functions
const sendNewReportNotification = async (report) => {
  try {
    const User = require('../models/User');
    const adminUsers = await User.find({ role: 'admin', isActive: true });
    
    if (adminUsers.length === 0) {
      console.log('⚠️ No active admin users found for notification');
      return;
    }

    const adminEmails = adminUsers.map(admin => admin.email);
    const mailOptions = emailTemplates.newReport(report, adminEmails);

    const result = await transporter.sendMail(mailOptions);
    console.log('📧 New report notification sent to admins:', result.messageId);
    return result;
  } catch (error) {
    console.error('❌ Failed to send new report notification:', error);
  }
};

const sendStatusUpdateNotification = async (report, oldStatus, newStatus) => {
  try {
    // Don't send notification if status didn't actually change
    if (oldStatus === newStatus) return;

    const mailOptions = emailTemplates.statusUpdate(report, oldStatus, newStatus);
    const result = await transporter.sendMail(mailOptions);
    
    console.log(`📧 Status update notification sent: ${oldStatus} → ${newStatus}`);
    return result;
  } catch (error) {
    console.error('❌ Failed to send status update notification:', error);
  }
};

const sendReportResolvedNotification = async (report) => {
  try {
    const mailOptions = emailTemplates.reportResolved(report);
    const result = await transporter.sendMail(mailOptions);
    
    console.log('🎉 Report resolved notification sent to user');
    return result;
  } catch (error) {
    console.error('❌ Failed to send report resolved notification:', error);
  }
};

module.exports = {
  transporter,
  sendNewReportNotification,
  sendStatusUpdateNotification,
  sendReportResolvedNotification
};
