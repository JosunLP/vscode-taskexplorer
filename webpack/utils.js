
/**
 * @method apply
 * @param {Record<string, any>} object
 * @param {Record<string, any>} config
 * @param {Record<string, any>} [defaults]
 * @returns {Record<string, any>}
 */
const apply = (object, config, defaults) =>
{
    if (object)
    {
        if (defaults) {
            apply(object, defaults);
        }
        if (isObject(config)) {
            Object.keys(config).forEach((i) => { object[i] = config[i]; });
        }
    }
    return object;
};


/**
 * @method clone
 * @param {any} item
 * @returns {any}
 */
const clone = (item) =>
{
    if (!item) {
        return item;
    }
    if (isDate(item)) {
        return new Date(item.getTime());
    }
    if (isArray(item))
    {
        let i = item.length;
        const c = [];
        while (i--) { c[i] = clone(item[i]); }
        return c;
    }
    else if (isObject(item))
    {
        const c = {};
        Object.keys((item)).forEach((key) =>
        {
            c[key] = clone(item[key]);
        });
        return c;
    }
    return item;
};


const isObject = (v, allowArray) => !!v && (v instanceof Object || typeof v === "object") && (allowArray || !isArray(v));


const isArray = (v, allowEmp) => !!v && Array.isArray(v) && (allowEmp !== false || v.length > 0);


const isDate = (v) => !!v && Object.prototype.toString.call(v) === "[object Date]";


const isObjectEmpty = (v) => { if (v) { return Object.keys(v).filter(k => ({}.hasOwnProperty.call(v, k))).length === 0; } return true; };


/**
 * @method merge
 * @param  {...Record<string, any>} destination
 * @returns {any}
 */
const merge = (...destination) =>
{
    const ln = destination.length;
    for (let i = 1; i < ln; i++)
    {
        const object = destination[i];
        Object.keys(object).forEach((key) =>
        {
            const value = object[key];
            if (isObject(value))
            {
                const sourceKey = destination[0][key];
                if (isObject(sourceKey))
                {
                    merge(sourceKey, value);
                }
                else {
                    destination[0][key] = clone(value);
                }
            }
            else {
                destination[0][key] = value;
            }
        });
    }
    return destination[0];
};


/**
 * @method merge
 * @param  {...Record<string, any>} destination
 * @returns {any}
 */
const mergeIf = (...destination) =>
{
    const ln = destination.length;
    for (let i = 1; i < ln; i++)
    {
        const object = destination[i];
        for (const key in object)
        {
            if (!(key in destination[0]))
            {
                const value = object[key];
                if (isObject(value))
                {
                    destination[0][key] = clone(value);
                }
                else {
                    destination[0][key] = value;
                }
            }
        }
    }
    return destination[0];
};


const pick = (obj, ...keys) =>
{
    const ret = {};
    keys.forEach(key => { ret[key] = obj[key]; });
    return ret;
};


const pickBy = (obj, pickFn) =>
{
    const ret = {};
    Object.keys(obj).filter(k => pickFn(k)).forEach(key => ret[key] = obj[key]);
    return ret;
};


const pickNot = (obj, ...keys) =>
{
    const ret = apply({}, obj);
    keys.forEach(key => { delete ret[key]; });
    return ret;
};


module.exports = { apply, clone, isArray, isDate, isObject, isObjectEmpty, merge, mergeIf, pick, pickBy, pickNot };
