import { access } from 'fs/promises';
import { constants } from 'fs';
import { resolve } from 'path';
import { cwd } from 'process';
import { getFontMod } from '../src/misc.js';

/**
 * Check font file in folder
 * @param {Object} style
 * @param {String} style.family
 * @param {Number} style.wght
 * @param {Number} style.ital
 * @param {Object} params
 * @param {String} params.fontsDir
 * @returns {Promise<?String>}
 */
export default async function(style, params) {
    const fontsDir = params.fontsDir;
    if (fontsDir) {
        let mod = getFontMod(style);
        for (let ext of ['ttf', 'otf']) {
            let path = resolve(cwd(), `${fontsDir}/${style.family}/${mod}.${ext}`);
            try {
                await access(path, constants.F_OK);
                return path;
            } catch {}
        }
    }
    return null;
}