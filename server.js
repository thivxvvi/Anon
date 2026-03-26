const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = 'th123';

// ─── PUT YOUR MONGODB URL HERE ───────────────────────────────────────────────
const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://tristanhernandez006:th123@freedomwall-shard-00-00.y8wem.mongodb.net:27017,freedomwall-shard-00-01.y8wem.mongodb.net:27017,freedomwall-shard-00-02.y8wem.mongodb.net:27017/?ssl=true&replicaSet=atlas-2ro5ny-shard-0&authSource=admin&appName=Freedomwall';
// ─────────────────────────────────────────────────────────────────────────────

// Connect to MongoDB
mongoose.connect(MONGODB_URL, { dbName: 'anon' })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => { console.error('MongoDB connection error:', err); process.exit(1); });

// Message schema
const messageSchema = new mongoose.Schema({
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const Message = mongoose.model('Message', messageSchema);

app.use(express.json());
app.use(express.static(__dirname)); // Serve index.html, messages.html, style.css

// POST /api/messages — send an anonymous message
app.post('/api/messages', async (req, res) => {
  const { content } = req.body || {};
  if (!content || !content.trim()) {
    return res.status(400).json({ error: 'Message content cannot be empty' });
  }
  await Message.create({ content: content.trim() });
  res.status(201).json({ success: true, message: 'Message sent!' });
});

// GET /api/messages?password=th123 — get all messages (admin only)
app.get('/api/messages', async (req, res) => {
  if (req.query.password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const messages = await Message.find().sort({ createdAt: 1 });
  res.json({
    messages: messages.map(m => ({
      id: m._id,
      content: m.content,
      createdAt: m.createdAt.toISOString()
    }))
  });
});

// DELETE /api/messages/:id?password=th123 — delete a message (admin only)
app.delete('/api/messages/:id', async (req, res) => {
  if (req.query.password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  await Message.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'Message deleted' });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Admin panel: http://localhost:${PORT}/messages.html`);
});
