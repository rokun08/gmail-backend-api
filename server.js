const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const API_KEY = 'RUKUN2025';

// MongoDB Connection
mongoose.connect('mongodb+srv://rokun08:gmailpass123@rokun.tp1gpkm.mongodb.net/gmailgen?retryWrites=true&w=majority')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error(err));

// Schemas
const GmailSchema = new mongoose.Schema({ email: String });
const HistorySchema = new mongoose.Schema({ email: String, time: Date });

const Gmail = mongoose.model('Gmail', GmailSchema);
const History = mongoose.model('History', HistorySchema);

// Middleware for API Key
app.use((req, res, next) => {
  const key = req.headers['x-api-key'];
  if (key !== API_KEY) {
    return res.status(403).json({ message: 'Invalid API key' });
  }
  next();
});

// Import Gmail List
app.post('/api/gmails/import', async (req, res) => {
  const { gmails } = req.body;
  if (!Array.isArray(gmails)) return res.status(400).json({ message: 'Invalid data' });

  const existing = await Gmail.find({ email: { $in: gmails } }).select('email');
  const existingEmails = existing.map(g => g.email);
  const newEmails = gmails.filter(g => !existingEmails.includes(g)).map(email => ({ email }));

  await Gmail.insertMany(newEmails);
  res.json({ added: newEmails.length });
});

// Get Random Gmail not in history
app.get('/api/gmails/random', async (req, res) => {
  const used = await History.find().select('email');
  const usedEmails = used.map(h => h.email);

  const unused = await Gmail.find({ email: { $nin: usedEmails } });
  if (unused.length === 0) return res.status(404).json({ message: 'No unused Gmail available' });

  const random = unused[Math.floor(Math.random() * unused.length)];
  res.json(random);
});

// Add to history
app.post('/api/history/mark', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'No email provided' });

  await History.create({ email, time: new Date() });
  res.json({ message: 'Marked in history' });
});

// Get history
app.get('/api/history', async (req, res) => {
  const history = await History.find().sort({ time: -1 });
  res.json(history);
});

// Delete from history
app.post('/api/history/delete', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'No email provided' });

  await History.deleteOne({ email });
  res.json({ message: 'Deleted from history' });
});

// ✅ Home Route (for testing Render deployment)
app.get('/', (req, res) => {
  res.send("✅ Gmail Generator API is live and working!");
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
