const express = require('express');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 3000;
const DOWNLOAD_DIR = path.join(__dirname, 'downloads');

// Ensure the downloads directory exists
if (!fs.existsSync(DOWNLOAD_DIR)) {
  fs.mkdirSync(DOWNLOAD_DIR);
}

// Middleware to parse JSON bodies
app.use(express.json());

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Download endpoint
app.post('/download', async (req, res) => {
  const { url, format } = req.body;
  const id = uuidv4();
  const ext = format === 'mp3' ? 'mp3' : 'mp4';
  const outputPath = path.join(DOWNLOAD_DIR, `${id}.${ext}`);

  console.log(`Starting download for ${url} as ${ext}`);

  // Construct the yt-dlp command
  let command = `yt-dlp "${url}" -o "${outputPath}"`;

  if (format === 'mp3') {
    command += ' --extract-audio --audio-format mp3';
  } else {
    command += ' --format bestvideo+bestaudio/best --merge-output-format mp4';
  }

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Download failed: ${error.message}`);
      console.error(`stderr: ${stderr}`);
      return res.status(500).json({ error: 'Download failed' });
    }
    console.log(`Download complete: ${outputPath}`);
    res.download(outputPath, (err) => {
      if (err) {
        console.error(`File download error: ${err.message}`);
      }
      // Delete the file after sending
      fs.unlink(outputPath, (err) => {
        if (err) {
          console.error(`File deletion error: ${err.message}`);
        } else {
          console.log(`File deleted: ${outputPath}`);
        }
      });
    });
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
