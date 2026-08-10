import 'dotenv/config';

(async () => {
  try {
    const m = await import('../lib/email.js');
    const send = m.sendKeyEmail;
    if (!send) {
      console.error('NO_SEND_FN', Object.keys(m));
      process.exit(2);
    }

    const to = process.argv[2] || process.env.TO_EMAIL || 'jawwadsiddique0987@gmail.com';
    await send({ toEmail: to, plan: 'weekly', keyCode: 'TEST-SMTP-KEY' });
    console.log('SEND_OK');
    process.exit(0);
  } catch (e) {
    console.error('SEND_ERR', e && (e.stack || e));
    process.exit(1);
  }
})();
