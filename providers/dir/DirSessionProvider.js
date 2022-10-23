import FontsSessionProvider from '../../src/FontsSessionProvider.js';

/**
 * @typedef {import('./DirProvider.js').default} DirProvider
 * @typedef {import('../../src/types.js').FontSource} FontSource
 */

export default class DirSessionProvider extends FontsSessionProvider {
    
    /**
     * @type {DirProvider}
     */
    #provider;

    /**
     * @param {DirProvider} provider
     */
    constructor(provider) {
        super();
        this.#provider = provider;
    }

    /**
     * @param {String} family
     * @returns {Promise<FontSource[]>}
     */
    async getVariants(family) {
        return await this.#provider.getVariants(family);
    }
}