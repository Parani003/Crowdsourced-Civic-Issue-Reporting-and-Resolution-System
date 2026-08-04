// Mock email dispatcher utility for development.
// In a full production application, this should connect to SMTP (nodemailer) or an external mail provider (SendGrid).
export const sendEmail = async (options) => {
  console.log('\n=========================================');
  console.log('📬  DEV ENV: MOCK EMAIL DISPATCHER');
  console.log(`👤  To: ${options.email}`);
  console.log(`🏷️  Subject: ${options.subject}`);
  console.log('-----------------------------------------');
  console.log(options.message);
  console.log('=========================================\n');
  
  // Simulate network dispatch delay
  return new Promise((resolve) => setTimeout(resolve, 300));
};
