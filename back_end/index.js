require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const mainRoutes = require('./routes/mainRoutes');

const app = express();
const PORT = process.env.PORT || 8000;

const { initDb } = require('./utils/db');

app.use(cors());
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/teleswift', mainRoutes);

// Only listen on port if run standalone / directly (not when imported or on Vercel)
if (require.main === module && !process.env.VERCEL) {
    initDb().then(() => {
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`Server is running on port ${PORT}`);
        });
    }).catch(console.error);
}

module.exports = app;
