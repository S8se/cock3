// app.js
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const app = express();
const PORT = 3000;

app.use(express.static('dictionary-app'));  // ชี้ไปที่โฟลเดอร์โปรเจกต์ของคุณ

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
// ตั้งค่า MongoDB
mongoose.connect('mongodb://localhost:27017/', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('เชื่อมต่อ MongoDB สำเร็จ'))
  .catch((err) => console.error('การเชื่อมต่อ MongoDB ผิดพลาด:', err));

// สร้าง Schema สำหรับคำศัพท์
const wordSchema = new mongoose.Schema({
  word: { type: String, required: true },
  definition: { type: String, required: true },
  status: { type: String, enum: ['approved', 'pending'], default: 'pending' },
});

const Word = mongoose.model('Word', wordSchema);

// ตั้งค่า Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// HTML หน้าเว็บหลัก
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Dictionary</title>
    </head>
    <body>
      <h1>Dictionary</h1>

      <!-- แบบฟอร์มค้นหา -->
      <div>
        <h2>Search</h2>
        <input type="text" id="searchInput" placeholder="Enter word">
        <button onclick="searchWord()">Search</button>
        <div id="searchResults"></div>
      </div>

      <!-- แบบฟอร์มเพิ่มคำศัพท์ -->
      <div>
        <h2>Suggest a Word</h2>
        <input type="text" id="newWord" placeholder="New word">
        <textarea id="definition" placeholder="Definition"></textarea>
        <button onclick="submitWord()">Submit</button>
        <div id="submissionMessage"></div>
      </div>

      <script>
        // ฟังก์ชันการค้นหา
        async function searchWord() {
          const query = document.getElementById('searchInput').value;
          const response = await fetch('/words/search?query=' + query);
          const words = await response.json();
          const results = words.map(word => '<p><strong>' + word.word + '</strong>: ' + word.definition + '</p>').join('');
          document.getElementById('searchResults').innerHTML = results || 'No results found';
        }

        // ฟังก์ชันส่งคำศัพท์ใหม่
        async function submitWord() {
          const word = document.getElementById('newWord').value;
          const definition = document.getElementById('definition').value;

          const response = await fetch('/words/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ word, definition })
          });

          const message = await response.text();
          document.getElementById('submissionMessage').innerText = message;
        }
      </script>
    </body>
    </html>
  `);
});

// เพิ่มคำศัพท์ (สำหรับแอดมิน)
app.post('/words/add', async (req, res) => {
  const { word, definition } = req.body;
  const newWord = new Word({ word, definition, status: 'approved' });
  await newWord.save();
  res.send('Word added successfully');
});

// ค้นหาคำศัพท์
app.get('/words/search', async (req, res) => {
  const { query } = req.query;
  const words = await Word.find({ word: new RegExp(query, 'i'), status: 'approved' });
  res.json(words);
});

// ส่งคำศัพท์ใหม่ (สำหรับผู้ใช้ทั่วไป)
app.post('/words/submit', async (req, res) => {
  const { word, definition } = req.body;
  const newWord = new Word({ word, definition, status: 'pending' });
  await newWord.save();
  res.send('Word submitted for review');
});

// เริ่มเซิร์ฟเวอร์
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on http://49.49.236.56:${PORT}`));


