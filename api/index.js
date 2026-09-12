const { createRadarApp } = require('./radar.cjs');

const app = createRadarApp();

module.exports = function handler(req, res) {
  try {
    const forwarded = req.headers['x-forwarded-uri'] || req.headers['x-invoke-path'];
    if (typeof forwarded === 'string' && forwarded.startsWith('/api')) {
      req.url = forwarded;
    }
    return app(req, res);
  } catch (error) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        error: error && error.message ? error.message : String(error),
        stack: error && error.stack ? error.stack : null,
        url: req.url,
      })
    );
  }
};

module.exports.config = {
  runtime: 'nodejs',
  maxDuration: 60,
};
