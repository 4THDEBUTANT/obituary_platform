'use strict';

const http = require('http');
const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const slugify = require('slugify');
const path = require('path');
const port = process.env.PORT || 1337;

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

const dbPath = path.resolve(__dirname, 'obituary_platform.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Database connection error:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        db.run(`CREATE TABLE IF NOT EXISTS obituaries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      date_of_birth TEXT,
      date_of_death TEXT,
      content TEXT,
      author TEXT,
      slug TEXT UNIQUE,
      submission_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);
    }
});

// Route to serve the home page with options
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Route to serve the obituary form
app.get('/submit_obituary_form', (req, res) => {
    console.log('Received request for /submit_obituary_form');
    res.sendFile(path.join(__dirname, 'public', 'obituary_form.html'));
});

// Route to handle obituary submission
app.post('/submit_obituary', (req, res) => {
    const { name, date_of_birth, date_of_death, content, author } = req.body;
    const slug = slugify(name, { lower: true, strict: true });

    const query = `INSERT INTO obituaries (name, date_of_birth, date_of_death, content, author, slug) 
                 VALUES (?, ?, ?, ?, ?, ?)`;

    db.run(query, [name, date_of_birth, date_of_death, content, author, slug], function (err) {
        if (err) {
            res.status(500).send('Database error');
            return console.error('Error inserting obituary:', err.message);
        }
        res.sendFile(path.join(__dirname, 'public', 'success.html'));
    });
});

// Route to view all obituaries
app.get('/view_obituaries', (req, res) => {
    const query = `SELECT * FROM obituaries`;

    db.all(query, [], (err, rows) => {
        if (err) {
            res.status(500).send('Database error');
            return console.error('Error retrieving obituaries:', err.message);
        }

        let html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>View Obituaries</title>
        <link rel="stylesheet" href="/css/styles.css">
      </head>
      <body>
        <div class="container">
          <h1>Obituaries</h1>
          <table>
            <tr>
              <th>Name</th>
              <th>Date of Birth</th>
              <th>Date of Death</th>
              <th>Content</th>
              <th>Author</th>
              <th>Submission Date</th>
            </tr>`;

        rows.forEach((row) => {
            html += `<tr>
                <td>${row.name}</td>
                <td>${row.date_of_birth}</td>
                <td>${row.date_of_death}</td>
                <td>${row.content}</td>
                <td>${row.author}</td>
                <td>${row.submission_date}</td>
               </tr>`;
        });

        html += `
          </table>
          <div class="social-buttons">
            <a class="facebook" href="https://www.facebook.com/sharer/sharer.php?u=http://localhost:1337/view_obituaries" target="_blank">Share on Facebook</a>
            <a class="twitter" href="https://twitter.com/intent/tweet?url=http://localhost:1337/view_obituaries" target="_blank">Share on Twitter</a>
          </div>
        </div>
      </body>
      </html>`;

        res.send(html);
    });
});

http.createServer(app).listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
