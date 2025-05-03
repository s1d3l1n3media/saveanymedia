
const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.post('/api/download', (req, res) => {
  const { url, format } = req.body;

  if (!url || !format) return res.status(400).json({ error: 'Missing URL or format' });

  const output = `server/downloads/%(title)s.%(ext)s`;
  const cmd = `yt-dlp -f ${format === 'mp3' ? 'bestaudio' : 'bestvideo+bestaudio'} --output "${output}" ${url} ${format === 'mp3' ? '--extract-audio --audio-format mp3' : ''}`;

  exec(cmd, (err, stdout, stderr) => {
    if (err) {
      console.error(stderr);
      return res.status(500).json({ error: 'Download failed' });
    }

    res.json({ success: true, message: 'Download started successfully' });
  });
});

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
