const app = require('../back_end/index.js');
const { initDb } = require('../back_end/utils/db');

module.exports = async (req, res) => {
    try {
        await initDb();
    } catch (e) {
        console.error("Database initialization error:", e);
    }
    return app(req, res);
};
