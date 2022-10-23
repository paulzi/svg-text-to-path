import FontsSessionProvider from '../../src/FontsSessionProvider.js';

/**
 * @typedef {import('./HttpProvider.js').default} HttpProvider
 * @typedef {import('../../src/types.js').FontSource} FontSource
 * @typedef {import('../../src/types.js').FontSourceMap} FontSourceMap
 */

export default class HttpSessionProvider extends FontsSessionProvider {

    /**
     * @type {HttpProvider}
     */
    #provider;

    /**
     * @type {Map<String, FontSourceMap|FontSource[]}
     */
    #cache;
    
    /**
     * @param {HttpProvider} provider
     */
    constructor(provider) {
        super();
        this.#provider = provider;
        this.#cache    = new Map();
    }

    /**
     * @param {String} family
     * @returns {Promise<FontSource[]>}
     */
    async getVariants(family) {
        let url = this.#provider.getUrl(family);
        let result = this.#cache.get(url);
        if (result) {
            return this.#provider.getVariantsFromData(result, family);
        }
        result = await this.#provider.loadData(family);
        this.#cache.set(url, result);
        return this.#provider.getVariantsFromData(result, family);
    }
}