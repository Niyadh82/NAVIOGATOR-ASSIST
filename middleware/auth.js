// middleware/auth.js
// Simple Basic-Auth guard for the admin dashboard

module.exports = function basicAuth(req, res, next) {
  const header = req.headers['authorization'] || '';
  const [type, encoded] = header.split(' ');

  if (type !== 'Basic' || !encoded) {
    return res
      .set('WWW-Authenticate', 'Basic realm="Navigator Admin"')
      .status(401)
      .json({ error: 'Authentication required.' });
  }

  const decoded = Buffer.from(encoded, 'base64').toString('utf8');
  const [user, pass] = decoded.split(':');

  const validUser = process.env.ADMIN_USER || 'admin';
  const validPass = process.env.ADMIN_PASS || 'changeme123';

  if (user === validUser && pass === validPass) {
    return next();
  }

  return res
    .set('WWW-Authenticate', 'Basic realm="Navigator Admin"')
    .status(401)
    .json({ error: 'Invalid credentials.' });
};
