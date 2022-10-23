import { shims } from '../src/shims/index.js';
import * as browserShims from '../src/shims/browser.js';

Object.assign(shims, browserShims);

export { default } from '../src/Session.js';
