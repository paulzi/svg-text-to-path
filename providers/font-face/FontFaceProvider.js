import FontsProvider from '../../src/FontsProvider.js';
import FontFaceSessionProvider from './FontFaceSessionProvider.js';

/**
 * @typedef {import('../../src/types.js').SessionParams} SessionParams
 * @typedef {import('../../src/Session.js').default} Session
 */

export default class FontFaceProvider extends FontsProvider {

    /**
     * @param {SessionParams} params
     * @returns {FontFaceProvider}
     */
    static create(params) {
        if (params.useFontFace) {
            return new FontFaceProvider();
        }
        return null;
    }

    /**
     * @param {Session} session
     * @returns {FontFaceSessionProvider}
     */
    createSession(session) {
        return new FontFaceSessionProvider(session);
    }
}