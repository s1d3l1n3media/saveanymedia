const express = require('express');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const DOWNLOAD_DIR = path.join(__dirname, 'downloads');

// Create downloads folder if missing
if (!fs.existsSync(DOWNLOAD_DIR)) {
  fs.mkdirSync(DOWNLOAD_DIR);
}

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Download endpoint
app.post('/api/download', (req, res) => {
  const { url, format } = req.body;

  if (!url || !format) {
    return res.status(400).json({ error: 'Missing URL or format' });
  }

  const id = uuidv4();
  const ext = format === 'mp3' ? 'mp3' : 'mp4';
  const filename = `${id}.${ext}`;
  const outputPath = path.join(DOWNLOAD_DIR, filename);

  let command = `yt-dlp "${url}" -o "${outputPath}"`;

  if (format === 'mp3') {
    command += ' --extract-audio --audio-format mp3';
  } else {
    command += ' --format bestvideo+bestaudio/best --merge-output-format mp4';
  }

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`yt-dlp error: ${stderr}`);
      return res.status(500).json({ error: 'Download failed' });
    }

    console.log(`Download complete: ${filename}`);
    return res.json({ 
      message: 'Download ready',
      downloadUrl: `/download/${filename}` 
    });
  });
});

// Serve download and delete after
app.get('/download/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(DOWNLOAD_DIR, filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).send('File not found');
  }

  res.download(filePath, (err) => {
    if (!err) {
      fs.unlink(filePath, (err) => {
        if (err) console.error(`Failed to delete file: ${err.message}`);
        else console.log(`Deleted file: ${filePath}`);
      });
    } else {
      console.error(`Download error: ${err.message}`);
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
