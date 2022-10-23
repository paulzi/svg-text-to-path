import { shims } from '../src/shims/index.js';
import * as browserShims from '../src/shims/browser.js';
import Session from '../src/Session.js';
import OpenTypeJsFont from "../renderer/OpenTypeJsFont.js";
import ConfigProvider from '../providers/config/ConfigProvider.js';
import FontFaceProvider from '../providers/font-face/FontFaceProvider.js';
import HttpProvider from '../providers/http/HttpProvider.js';
import GoogleProvider from '../providers/google/GoogleProvider.js';

Object.assign(shims, browserShims);
Session.defaultRenderer = OpenTypeJsFont;
Session.defaultProviders = [ConfigProvider, FontFaceProvider, HttpProvider, GoogleProvider];
Session.providers = {ConfigProvider, FontFaceProvider, HttpProvider, GoogleProvider};

export default Session;
