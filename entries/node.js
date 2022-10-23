import { shims } from '../src/shims/index.js';
import * as nodeShims from '../src/shims/node.js';
import Session from '../src/Session.js';
import FontkitFont from '../renderer/FontkitFont.js';
import OpenTypeJsFont from '../renderer/OpenTypeJsFont.js';
import ConfigProvider from '../providers/config/ConfigProvider.js';
import FontFaceProvider from '../providers/font-face/FontFaceProvider.js';
import DirProvider from '../providers/dir/DirProvider.js';
import HttpProvider from '../providers/http/HttpProvider.js';
import GoogleProvider from '../providers/google/GoogleProvider.js';

Object.assign(shims, nodeShims);
Session.defaultRenderer = FontkitFont;
Session.defaultProviders = [ConfigProvider, FontFaceProvider, DirProvider, HttpProvider, GoogleProvider];
Session.providers = {ConfigProvider, FontFaceProvider, DirProvider, HttpProvider, GoogleProvider};
Session.renderers = {FontkitFont, OpenTypeJsFont};

/**
 * @typedef {Object} NodeProviders
 * @property {ConfigProvider} ConfigProvider
 * @property {FontFaceProvider} FontFaceProvider
 * @property {DirProvider} DirProvider
 * @property {HttpProvider} HttpProvider
 * @property {GoogleProvider} GoogleProvider
 */

export default Session;