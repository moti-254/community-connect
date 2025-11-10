require('dotenv').config();
const nodemailer = require('nodemailer');

console.log('📧 Testing Gmail Configuration...');
console.log('Email:', process.env.EMAIL_USER);
console.log('Pass Set:', process.env.EMAIL_PASS ? '✅ Yes' : '❌ No');

const testGmail = async () => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    console.log('🔐 Testing Gmail authentication...');
    await transporter.verify();
    console.log('✅ Gmail authentication successful!');

    console.log('📤 Sending test email...');
    const result = await transporter.sendMail({
      from: `"Community Connect" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER, // Send to yourself
      subject: '✅ Community Connect - Gmail Test',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color: #2563eb;">🎉 Gmail Test Successful!</h2>
          <p>Your Community Connect backend can now send real emails via Gmail!</p>
          <p><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
        </div>
      `
    });

    console.log('✅ Test email sent via Gmail!');
    console.log('📧 Check your Gmail inbox');
    
  } catch (error) {
    console.error('❌ Gmail test failed:');
    console.error('Error:', error.message);
    
    if (error.code === 'EAUTH') {
      console.log('\n🔐 Possible issues:');
      console.log('1. 2FA not enabled');
      console.log('2. Wrong App Password');
      console.log('3. Using regular password instead of App Password');
    }
  }
};

testGmail();