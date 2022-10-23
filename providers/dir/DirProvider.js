import { readdir, access } from 'fs/promises';
import { resolve, parse } from 'path';
import { cwd } from 'process';
import FontsProvider from '../../src/FontsProvider.js';
import DirSessionProvider from './DirSessionProvider.js';
import Cache from '../../src/Cache.js';

/**
 * @typedef {import('../../src/types.js').FontSource} FontSource
 * @typedef {import('../../src/types.js').SessionParams} SessionParams
 */

export default class DirProvider extends FontsProvider {
    
    /**
     * @type {String}
     */
    #dir;

    /**
     * @type {Cache}
     */
    #cache;

    /**
     * @param {String} dir
     * @param {Number} cache
     */
    constructor(dir, cache = 0) {
        super();
        this.#dir   = dir;
        this.#cache = new Cache(cache);
    }

    /**
     * @param {SessionParams} params 
     * @returns {DirProvider}
     */
    static create(params) {
        if (params.fontsDir) {
            return new DirProvider(params.fontsDir, params.fontsDirCache ?? 0);
        }
        return null;
    }

    /**
     * @returns {DirSessionProvider}
     */
    createSession() {
        return new DirSessionProvider(this);
    }
    
    /**
     * @param {String} family
     * @returns {Promise<FontSource[]>}
     */
    async getVariants(family) {
        let result = this.#cache.get(family);
        if (result) {
            return result;
        }
        let folder = resolve(cwd(), `${this.#dir}/${family}`);
        let files;
        try {
            await access(folder);
            files = await readdir(folder);
        } catch {
            files = [];
        }
        result = [];
        files.forEach(file => {
            let {name, ext} = parse(file);
            if (['.ttf', '.otf', '.woff', '.woff2'].includes(ext)) {
                let match;
                let path = `${folder}/${file}`;
                match = name.match(/^(\d{3})(i?)$/);
                if (match) {
                    result.push({
                        wght: parseInt(match[1]),
                        ital: match[2] === 'i' ? 1 : 0,
                        source: path,
                    })
                }
                let source = {};
                for (let def of name.split(';')) {
                    let match = def.match(/^([a-zA-Z]{4}),(-?\d+)(?:\.\.(-?\d+))?$/);
                    if (!match) {
                        source = null;
                        break;
                    }
                    let [, axis, from, to] = match;
                    source[axis] = match.length > 3 ? [from, to] : from;
                }
                if (source) {
                    source.source = path;
                    result.push(source);
                }
            }
        });
        this.#cache.set(family, result);
        return result;
    }
}