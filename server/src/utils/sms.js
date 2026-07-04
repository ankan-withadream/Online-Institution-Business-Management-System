import env from '../config/env.js';

const FAST2SMS_URL = 'https://www.fast2sms.com/dev/bulkV2';

export const sendSMS = async ({ numbers, message, route = 'q' }) => {
  if (!env.FAST2SMS_API_KEY) {
    console.warn('FAST2SMS_API_KEY not configured — skipping SMS send');
    return { skipped: true, reason: 'No API key configured' };
  }

  if (!numbers || !message) {
    console.warn('SMS skipped: missing numbers or message');
    return { skipped: true, reason: 'Missing numbers or message' };
  }

  const numbersStr = Array.isArray(numbers) ? numbers.join(',') : numbers;

  try {
    const response = await fetch(FAST2SMS_URL, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        authorization: env.FAST2SMS_API_KEY,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        route,
        numbers: numbersStr,
        message,
      }),
    });

    const data = await response.json();
    return data;
  } catch (err) {
    console.error('fast2sms send error:', err);
    return { error: err.message };
  }
};

export const sendWelcomeSMS = async (studentName, phone, courseName) => {
  const message = `Dear ${studentName}, your admission to ${courseName} has been approved. Welcome to Vivekananda Education & Health Training Institute. Your student portal credentials will be shared via email. - VEHTI`;

  return sendSMS({ numbers: phone, message });
};
