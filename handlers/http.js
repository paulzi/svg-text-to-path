import { getFontMod } from '../src/misc.js';
import { fetch } from '../src/shims.js';

/**
 * Check font file in web-repository
 * @param {Object} style
 * @param {String} style.family
 * @param {Number} style.wght
 * @param {Number} style.ital
 * @param {Object} params
 * @param {String} params.fontsUrl
 * @returns {Promise<?String>}
 */
export default async function(style, params) {
    const fontsUrl = params.fontsUrl;
    if (fontsUrl) {
        let mod = getFontMod(style);
        let promises = [];
        for (let ext of ['ttf', 'otf']) {
            let url = `${fontsUrl}/${style.family}/${mod}.${ext}`;
            let promise = fetch(url, {method: 'HEAD'})
                .then(response => {
                    if (response.status !== 200) {
                        throw new Error('');
                    }
                    return url;
                });
            promises.push(promise);
        }
        try {
            return await Promise.any(promises);
        } catch {}
    }
    return null;
}