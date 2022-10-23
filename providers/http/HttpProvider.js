import FontsProvider from '../../src/FontsProvider.js';
import HttpSessionProvider from './HttpSessionProvider.js';
import Cache from '../../src/Cache.js';
import { fetch } from '../../src/shims/index.js';

/**
 * @typedef {import('../../src/types.js').FontSource} FontSource
 * @typedef {import('../../src/types.js').FontSourceMap} FontSourceMap
 * @typedef {import('../../src/types.js').SessionParams} SessionParams
 */

export default class HttpProvider extends FontsProvider {

    /**
     * @type {Cache}
     */
    #cache;

    /**
     * @type {String}
     */
    #repoUrl;

    /**
     * @type {Boolean}
     */
    #perFamily;

    /**
     * @type {Map<String, Promise>}
     */
    #loading;

    /**
     * @param {String} repoUrl
     * @param {Number} cache
     */
    constructor(repoUrl, cache) {
        super();
        this.#repoUrl   = repoUrl;
        this.#perFamily = repoUrl.indexOf('--family--') !== -1;
        this.#cache     = new Cache(cache ?? 600000);
        this.#loading   = new Map();
    }

    /**
     * @param {SessionParams} params 
     * @returns {HttpProvider}
     */
    static create(params) {
        if (params.fontsUrl) {
            return new HttpProvider(params.fontsUrl, params.fontsUrlCache ?? null);
        }
        return null;
    }

    /**
     * @returns {HttpSessionProvider}
     */
    createSession() {
        return new HttpSessionProvider(this);
    }

    /**
     * @param {String} family
     * @returns {String} 
     */
    getUrl(family) {
        return this.#repoUrl.replace('--family--', encodeURIComponent(family));
    }

    /**
     * @param {*} data
     * @param {String} family
     * @return {FontSourceMap|FontSource[]}
     */
    processData(data, family) {
        return data;
    }

    /**
     * @param {FontSourceMap|FontSource[]} data
     * @param {String} family
     * @return {FontSource[]}
     */
    getVariantsFromData(data, family) {
        if (this.#perFamily) {
            return data;
        }
        return data[family] || [];
    }

    /**
     * @param {String} family
     * @returns {Promise<FontSourceMap|FontSource[]>}
     */
    async loadData(family) {
        let url = this.getUrl(family);
        let result = this.#cache.get(url);
        if (result) {
            return result;
        }
        let promise = this.#loading.get(url) || this.#loadData(url);
        this.#loading.set(url, promise);
        result = await promise;
        this.#loading.delete(url);
        result = this.processData(result, family);
        this.#cache.set(url, result);
        return result;
    }

    /**
     * @param {String} url 
     * @returns {Promise}
     */
    async #loadData(url) {
        let response = await fetch(url);
        return await response.json();
    }
}