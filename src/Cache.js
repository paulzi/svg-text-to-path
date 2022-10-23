export default class Cache {
    
    /**
     * @type {Map}
     */
    #map;
    
    /**
     * @type {Number}
     */
    #duration;

    /**
     * @param {Number} [duration] 
     */
    constructor(duration = Infinity) {
        this.#map      = new Map();
        this.#duration = duration;
    }

    /**
     * @param {*} key
     * @returns {*}
     */
    get(key) {
        let {time, duration, value} = this.#map.get(key) ?? {};
        if (time + duration < Date.now()) {
            this.#map.delete(key);
            return;
        }
        return value;
    }

    /**
     * @param {*} key 
     * @param {*} value 
     * @param {Number} [duration] 
     */
    set(key, value, duration) {
        duration = duration ?? this.#duration;
        if (duration > 0) {
            this.#map.set(key, {time: Date.now(), duration, value});
        }
    }
}