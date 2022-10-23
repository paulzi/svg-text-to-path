/**
 * @typedef {import('./types.js').FontSource} FontSource
 */

const axisDefault = {
    wdth: 100,
    wght: 400,
    ital: 0,
    slnt: 0,
};

/**
 * @param {FontSource} variant
 * @param {String} axis 
 * @returns {Number[]}
 */
function normalizeVariantAxis(variant, axis) {
    let value = variant[axis] ?? axisDefault[axis];
    return Array.isArray(value) ? value : [value, value];
}

/**
 * @param {FontSource} variant 
 * @param {String} axis 
 * @param {Number} target 
 * @returns {Boolean}
 */
function variantMatchAxis(variant, axis, target) {
    target = target ?? axisDefault[axis];
    let [from, to] = normalizeVariantAxis(variant, axis);
    return from <= target && target <= to;
}

export default class FontStyle {
    
    /**
     * @type {String[]}
     */
    families;

    /**
     * @type {{[key: String]: Number}}
     */
    axes;

    /**
     * @type {{[key: String]: Number}}
     */
    features;

    /**
     * @type {{[key: String]: Number}}
     */
    static axisDefault = axisDefault;

    /**
     * @type {function(FontSource, String) : Number[]}
     */
    static normalizeVariantAxis = normalizeVariantAxis;

    /**
     * @param {String[]} families 
     * @param {{[key: String]: Number}} axes
     * @param {{[key: String]: Number}} [features]
     */
    constructor(families, axes, features = {}) {
        this.families = families;
        this.axes     = axes;
        this.features = features;
    }

    /**
     * FontStyle matches variant axis
     * @param {FontSource} variant
     * @param {String} axis
     * @returns {Boolean}
     */
    matchAxis(variant, axis) {
        return variantMatchAxis(variant, axis, this.axes[axis]);
    }

    /**
     * FontStyle  matches variant
     * @param {FontSource} variant
     * @returns {Boolean}
     */
    match(variant) {
        for (let axis of Object.keys(axisDefault)) {
            if (!this.matchAxis(variant, axis)) {
                return false;
            }
        }
        return true;
    }

    /**
     * Return best variant for family
     * @param {FontSource[]} variants 
     * @returns {?FontSource}
     * @see https://drafts.csswg.org/css-fonts-4/#font-matching-algorithm
     */
    getBestVariant(variants) {
        if (!variants.length) {
            return null;
        }
        let normalize = (variant, axis, target) => {
            let [from, to] = normalizeVariantAxis(variant, axis);
            return target < from ? from : (target > to ? to : target);
        };
        let sort = (variants, axis, target, inv = false, thr = null) => {
            return variants.sort((a, b) => {
                a = normalize(a, axis, target);
                b = normalize(b, axis, target);
                if (inv) {
                    return a > target || b > target ? a - b : b - a;
                }
                if (thr !== null && target <= thr && (a > thr || b > thr)) {
                    return a - b;
                }
                return a < target || b < target ? b - a : a - b;
            });
        };
        let filterEq = (variants, axis, target) => {
            target = normalize(variants[0], axis, target);
            return variants.filter(variant => variantMatchAxis(variant, axis, target))
        };
        let sortAndFilter = (variants, axis, target, inv = false, thr = null) => {
            return filterEq(sort(variants, axis, target, inv, thr), axis, target);
        }

        // wdth
        let wdth = this.axes.wdth ?? 100;
        variants = sortAndFilter(variants, 'wdth', wdth, wdth <= 100);

        // ital/slnt
        let ital = this.axes.ital ?? 0;
        let slnt = this.axes.slnt ?? 0;
        if (!slnt && !ital) {
            variants = sortAndFilter(variants, 'slnt', 0, true);
            variants = sortAndFilter(variants, 'ital', 0, false);
        } else if (ital > 0 && variants.some(item => normalize(item, 'ital', 1) > 0)) {
            variants = sortAndFilter(variants, 'ital', ital, false);
        } else if (variants.some(item => {
            let val = normalize(item, 'slnt', ital <= 0 && slnt > 0 ? 11 : -11);
            return slnt > 0 ? val > 0 : val < 0;
        })) {
            if (ital > 0) {
                variants = sortAndFilter(variants, 'slnt', -11, true);
            } else {
                variants = sortAndFilter(variants, 'slnt', slnt, slnt <= -11 || (slnt >= 0 && slnt < 11));
            }
        } else if (variants.some(item => normalize(item, 'ital', 1) > 0)) {
            variants = sortAndFilter(variants, 'ital', 1, Math.abs(slnt) < 11);
        } else {
            variants = sortAndFilter(variants, 'slnt', 0, slnt > 0);
        }
        
        // wght
        let wght = this.axes.wght ?? 400;
        variants = sortAndFilter(variants, 'wght', wght, wght < 400, 500);

        return variants[0] || null;
    }

    /**
     * Return string key for axes values
     * @param {String} family 
     * @param {{[key: String]: Number}} axes 
     * @returns {String}
     */
    static getKey(family, axes) {
        let obj = {family};
        Object.keys(axisDefault).forEach(axis => {
            obj[axis] = axes[axis] ?? axisDefault[axis];
        });
        return JSON.stringify(obj);
    }
}