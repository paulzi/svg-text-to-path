import internal from '../src/internal.js';

let families;
let loadPromise;

/**
 * Load font from google fonts
 * @param {Object} style
 * @param {String} style.family
 * @param {Number} style.wght
 * @param {Number} style.ital
 * @param {Object} params
 * @returns {?String}
 */
export default async function(style, params) {
    if (!families) {
        if (!params.googleApiKey) {
            throw new Error('Google Fonts API key is not set');
        }
        loadPromise = loadPromise || loadFamilies(params.googleApiKey);
        families = await loadPromise;
    }
    let item = families.get(style.family);
    if (!item) {
        return null;
    }
    let wght = style.wght || 400;
    let ital = style.ital || 0;
    let mod;
    if (wght === 400) {
        mod = ital ? 'italic' : 'regular';
    } else {
        mod = `${wght}${ital ? 'italic' : ''}`;
    }
    return item.files[mod] || null;
}

/**
 * Load family list from google fonts
 * @param {String} apiKey API key
 * @returns {Map<String, Object>} Return promise of Map family name => data
 */
async function loadFamilies(apiKey) {
    let url = 'https://www.googleapis.com/webfonts/v1/webfonts?sort=popularity&key=' + encodeURIComponent(apiKey);
    let response = await internal.fetch(url);
    let data = await response.json();
    let map = new Map();
    data.items.forEach(item => {
        map.set(item.family, item);
    });
    return map;
}