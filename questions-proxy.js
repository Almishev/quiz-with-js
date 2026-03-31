'use strict';

/**
 * Локален CORS proxy: тегли JSON от Google Drive и го подава на играта с
 * Access-Control-Allow-Origin, защото браузърният fetch до Drive често се блокира.
 *
 * Старт: node questions-proxy.js
 * След това отвори quiz-а през Live Server както досега.
 *
 * Същият файл като в game.js — при смяна на линка промени тук и в QUESTIONS_URL.
 */

const http = require('http');
const https = require('https');
const { URL } = require('url');

const PORT = 8787;
const REMOTE_URL =
    'https://drive.usercontent.google.com/uc?export=download&id=1WNDa11ED6DwExzGC_XfUbVLlKKCvfgz4';

const CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

function requestWithRedirects(urlStr, redirectCount, done) {
    if (redirectCount > 10) {
        done(new Error('Too many redirects'));
        return;
    }
    const u = new URL(urlStr);
    const opts = {
        hostname: u.hostname,
        port: u.port || (u.protocol === 'https:' ? 443 : 80),
        path: u.pathname + u.search,
        method: 'GET',
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; QuizQuestionsProxy/1.0)' },
    };
    const lib = u.protocol === 'https:' ? https : http;
    const req = lib.request(opts, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            const next = new URL(res.headers.location, urlStr).href;
            res.resume();
            requestWithRedirects(next, redirectCount + 1, done);
            return;
        }
        done(null, res);
    });
    req.on('error', done);
    req.end();
}

const server = http.createServer((req, res) => {
    if (req.method === 'OPTIONS') {
        res.writeHead(204, CORS);
        res.end();
        return;
    }

    const path = new URL(req.url, 'http://127.0.0.1').pathname;
    if (path !== '/questions' && path !== '/questions/') {
        res.writeHead(404, CORS);
        res.end('Not found');
        return;
    }

    requestWithRedirects(REMOTE_URL, 0, (err, remoteRes) => {
        if (err) {
            console.error(err);
            res.writeHead(502, CORS);
            res.end(String(err.message || err));
            return;
        }
        const headers = { ...CORS };
        const ct = remoteRes.headers['content-type'];
        headers['Content-Type'] = ct || 'application/json; charset=utf-8';
        res.writeHead(remoteRes.statusCode || 200, headers);
        remoteRes.pipe(res);
    });
});

server.listen(PORT, '127.0.0.1', () => {
    console.log(`Questions proxy: http://127.0.0.1:${PORT}/questions`);
});
