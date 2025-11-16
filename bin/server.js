#!/usr/bin/env node
import { createServer } from 'http';
import { URL } from 'url';
import { exit, stdout, stderr } from 'process';
import { readFileSync } from 'fs';
import Session from '../entries/node.js';

/**
 * @type {import('../entries/node.js').NodeProviders}
 */
let {ConfigProvider, FontFaceProvider, DirProvider, HttpProvider, GoogleProvider} = Session.providers;

let args = process.argv.slice(2);
let configFile = args[0];
if (configFile === '--help') {
    stdout.write('Usage: svg-text-to-path-server [configFile]');
    exit(2);
}

const config = configFile ? JSON.parse(readFileSync(configFile)) : {};
const port = config.port || 10000;

let initProviders = prepareInitProviders(config);

createServer(function(req, res) {
    try {
        let data = '';
        req.on('data', chunk => {
            data += chunk;
        });
        req.on('end', async () => {
            let url = new URL(req.url, `http://${req.headers.host}/`);
            let query = Object.fromEntries(url.searchParams.entries());
            let params = Object.assign({}, config, query);
            params.providers = createProviders(params, initProviders);

            let session = new Session(data, params);
            let stat = await session.replaceAll(params.selector || 'text');
            let headers = {
                'Content-Type': 'image/svg+xml',
                'Cache-Control': 'max-age=0',
                'X-Svg-Text-To-Path': JSON.stringify(stat),
            };
            if (params.stat) {
                headers['X-Svg-Text-To-Path'] = JSON.stringify(stat);
            }
            res.writeHead(200, headers);
            res.end(session.getSvgString());
        });
    } catch (e) {
        stderr.write(`ERROR: ${e.message}\n`);
        res.writeHead(500, {
            'Content-Type': 'image/svg+xml',
            'Cache-Control': 'max-age=0',
        });
        res.end(e.message);
    }
}).listen(port);

stdout.write(`Server running at http://localhost:${port}/\n`);

/**
 * @param {Object} config 
 * @returns {Object}
 */
function prepareInitProviders(config) {
    return {
        dir:    DirProvider.create(config),
        http:   HttpProvider.create(config),
        google: GoogleProvider.create(config),
    };
}

/**
 * @param {import('../src/types.js').SessionParams} params
 * @param {Object} initProviders
 * @returns {import('../src/FontsProvider.js').default}
 */
function createProviders(params, initProviders) {
    let providers = [];
    let provider;

    // ConfigProvider
    provider = ConfigProvider.create(params);
    provider && providers.push(provider);
    
    // FontFaceProvider
    provider = FontFaceProvider.create(params);
    provider && providers.push(provider);

    // DirProvider
    initProviders.dir && providers.push(initProviders.dir);

    // HttpProvider
    provider = params.fontsUrl === config.fontsUrl ? initProviders.http : HttpProvider.create(params);
    provider && providers.push(provider);

    // GoogleProvider
    provider = params.googleApiKey === config.googleApiKey ? initProviders.google : GoogleProvider.create(params);
    provider && providers.push(provider);

    return providers;
}