#!/usr/bin/env node
import { createServer } from 'http';
import { URL } from 'url';
import { exit, stdout, stderr } from 'process';
import { readFileSync } from 'fs';
import { replaceAllInString } from '../node.js';
import mapHandler from '../handlers/map.js';
import dirHandler from '../handlers/dir.js';
import httpHandler from '../handlers/http.js';
import googleHandler from '../handlers/google.js';

let args = process.argv.slice(2);
let configFile = args[0];
if (configFile === '--help') {
    stdout.write('Usage: svg-text-to-path-server [configFile]');
    exit(2);
}

const config = configFile ? JSON.parse(readFileSync(configFile)) : {};
config.onFontNotFound = (textNode, familyList, wght, ital) => {
    stderr.write(`Font ${familyList.join(', ')} (wght: ${wght}, ital: ${ital}) not found\n`);
}
const port = config.port || 10000;

createServer(function(req, res) {
    try {
        let url = new URL(req.url, `http://${req.headers.host}/`);
        let query = Object.fromEntries(url.searchParams.entries());
        let params = Object.assign(query, config);
    
        let handlers = [mapHandler, dirHandler];
        if (params.googleApiKey) {
            handlers.push(googleHandler);
        }
        handlers.push(httpHandler);
        params.handlers = handlers;
    
        let data = '';
        req.on('data', chunk => {
            data += chunk;
        });
        req.on('end', async () => {
            data = await replaceAllInString(data, params);
            res.writeHead(200, {
                'Content-Type': 'image/svg+xml',
                'Cache-Control': 'max-age=0',
            });
            res.end(data);
        });
    } catch (e) {
        stdout.write(`ERROR: ${e.message}\n`);
        res.writeHead(500, {
            'Content-Type': 'image/svg+xml',
            'Cache-Control': 'max-age=0',
        });
        res.end(e.message);
    }
}).listen(port);

stderr.write(`Server running at http://localhost:${port}/\n`);