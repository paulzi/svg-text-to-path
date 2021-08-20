import map from '../handlers/map.js';
import http from '../handlers/http.js';
import google from '../handlers/google.js';
import * as SvgTextToPath from '../browser.js';
window.SvgTextToPath = SvgTextToPath;
window.SvgTextToPath.handlers = {map, http, google};
