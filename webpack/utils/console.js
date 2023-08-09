/* eslint-disable jsdoc/no-undefined-types */
/* eslint-disable jsdoc/require-property-description */
/* eslint-disable @typescript-eslint/naming-convention */
// @ts-check

const { isString, isObject, isPrimitive, asArray } = require("./utils");

/** @typedef {import("../types").WpBuildApp} WpBuildApp */
/** @typedef {[ number, number ]} WpBuildLogColorMapping */
/** @typedef {import("../types").WpBuildLogIcon} WpBuildLogIcon */
/** @typedef {import("../types").WebpackLogLevel} WebpackLogLevel */
/** @typedef {import("../types").WpBuildLogColor} WpBuildLogColor */
/** @typedef {import("../types").WpBuildLogLevel}  WpBuildLogLevel */
/** @typedef {import("../types").WpBuildLogIconSet}  WpBuildLogIconSet */
/** @typedef {import("../types").WpBuildLogTrueColor} WpBuildLogTrueColor */

/**
 * @module wpbuild.utils.console
 */


class WpBuildConsoleLogger
{
    /**
     * @member
     * Can be used to adjust the leftmost character that console output should start at.  For example,
     * a logger implemented in a `Mocha` test would need to use a base pad of 6 characters to align
     * itself with Mocha's output.
     * @private
     */
    basePad = "";

    /**
     * @member
     * The build environment that owns the WpBuildConsoleLogger instance
     * @private
     * @type {WpBuildApp}
     */
    app;

    /**
     * @member
     * @private
     * @type {string}
     */
    infoIcon;

    // /**
    //  * @member
    //  * @private
    //  * @type {WebpackLogLevel[]}
    //  */
    // levelMap = [ "none", "error", "warn", "info", "log", "verbose" ];


    /**
     * @class WpBuildConsoleLogger
     * @param {WpBuildApp} app
     */
    constructor(app)
    {
        this.app = app;
        this.infoIcon = this.icons.color.info;
        if (app.rc)
        {
            this.infoIcon = app.rc.colors.infoIcon ?
                            this.withColor(this.icons.info, this.colors[app.rc.colors.infoIcon]) : this.icons.color.info;
            if (app.rc.colors.default)
            {
                Object.keys(this.colors).filter(c => this.colors[c][1] === this.colors.system).forEach((c) =>
                {
                    this.colors[c][1] = this.colorMap[app.rc.colors.default];
                });
            }
        }
        this.app.disposables?.push(this);
    }

    dispose = () => console.log(this.withColor("", this.colors.system, true));


    /**
     * @member
     * @private
     * @type {Record<WpBuildLogTrueColor, number>}
     */
    colorMap = {
        blue: 34,
        black: 0,
        cyan: 36,
        green: 32,
        grey: 90,
        magenta: 35,
        red: 31,
        system: 39,
        white: 37,
        yellow: 33
    };


    /** @type {Record<WpBuildLogColor, WpBuildLogColorMapping>} */
    colors = {
        black: [ this.colorMap.black, this.colorMap.system ],
        blue: [ this.colorMap.blue, this.colorMap.system ],
        bold: [ 1, 22 ],
        cyan: [ this.colorMap.cyan, this.colorMap.system ],
        green: [ this.colorMap.green, this.colorMap.system ],
        grey: [ this.colorMap.grey, this.colorMap.system ],
        inverse: [ 7, 27 ],
        italic: [ 3, 23 ],
        magenta: [ this.colorMap.magenta, this.colorMap.system ],
        red: [ this.colorMap.red, this.colorMap.system ],
        system: [ this.colorMap.system, this.colorMap.system ],
        underline: [ 4, 24 ],
        white: [ this.colorMap.white, this.colorMap.system ],
        yellow: [ this.colorMap.yellow, this.colorMap.system ]
    };


    /**
     * @type {WpBuildLogIconSet}
     */
    icons =
    {
        bullet: "●",
        error: "✘",
        info: "ℹ",
        star: "★",
        start: "▶",
        success: "✔",
        up: "△",
        warning: "⚠",
        blue:
        {
            error: this.withColor("✘", this.colors.blue),
            info: this.withColor("ℹ", this.colors.blue),
            success: this.withColor("✔", this.colors.blue),
            warning: this.withColor("⚠", this.colors.blue)
        },
        color:
        {
            bullet: this.withColor("●", this.colors.white),
            errorTag: this.withColor("[", this.colors.white) + this.withColor("ERROR", this.colors.red) + this.withColor("]", this.colors.white),
            info: this.withColor("ℹ", this.colors.magenta),
            star: this.withColor("★", this.colors.yellow),
            starCyan: this.withColor("★", this.colors.cyan),
            start: this.withColor("▶", this.colors.green),
            success: this.withColor("✔", this.colors.green),
            successTag: this.withColor("[", this.colors.white) + this.withColor("SUCCESS", this.colors.green) + this.withColor("]", this.colors.white),
            up: this.withColor("△", this.colors.white),
            warning: this.withColor("⚠", this.colors.yellow),
            error: this.withColor("✘", this.colors.red)
        }
    };


    /**
     * @function
     * @param {any} msg
     * @param {string} [pad]
     */
    error = (msg, pad) =>
    {
        let sMsg = msg;
        if (msg)
        {
            if (isString(msg))
            {
                sMsg = msg;
            }
            else if (msg instanceof Error)
            {
                sMsg = msg.message.trim();
                if (msg.stack) {
                    sMsg += `\n${msg.stack.trim()}`;
                }
            }
            else if (isObject<{}>(msg))
            {
                sMsg = "";
                if (msg.message) {
                    sMsg = msg.message;
                }
                if (msg.messageX) {
                    sMsg += `\n${msg.messageX}`;
                }
                sMsg = sMsg || msg.toString();
            }
            else if (!isString(msg))
            {
                sMsg = msg.toString();
            }
            this.write(sMsg, undefined, pad, this.icons.color.error);
        }
    };


    /**
     * @function Performs inline text coloring e.g. a message can contain ""..finished italic(main module) in 2.3s"
     * @param {string | undefined} msg
     * @returns {string}
     */
    format = (msg) =>
    {
        if (isString(msg, true))
        {
            for (const cKey of Object.keys(this.colors))
            {
                msg = msg.replace(new RegExp(`${cKey}\\((.*?)\\)`, "g"), (_, g1) => this.withColor(g1, this.colors[cKey]));
            }
            return " " + msg;
        }
        return "";
    };


    /**
     * @function
     * @param {string | undefined | null | 0 | false} icon
     * @returns {WpBuildLogColorMapping}
     */
    getIconColorMapping = (icon) =>
    {
        const app = this.app,
              colors = this.colors;
        let envTagClr = app ? colors[app.rc.colors.buildBracket] : colors.cyan;
        if (icon) {
            if (icon.includes(this.withColor(this.icons.info, colors.yellow))) {
                envTagClr = colors.yellow;
            }
            else if (icon.includes(this.withColor(this.icons.warning, colors.yellow))) {
                envTagClr = colors.red;
            }
            else if (icon.includes(this.withColor(this.icons.error, colors.red))) {
                envTagClr = colors.red;
            }
        }
        return envTagClr;
    };


    /**
     * @function
     * @param {string} icon
     * @param {WpBuildLogColorMapping} color color value
     * @returns {string}
     */
    iconColor = (icon, color) => { return this.withColor(icon, color); };


    /**
     * @function
     * @param {string | undefined} msg
     * @param {WpBuildLogLevel} [level]
     */
    start = (msg, level) =>  this.write(this.icons.color.start + (msg ? "  " + msg : ""), level);


    /**
     * @function
     * @param {WpBuildLogColor} color
     * @returns {WpBuildLogColorMapping}
     */
    str2clr = (color) => this.colors[color];


    /**
     * @function
     * @param {string | undefined} msg
     * @param {WpBuildLogColorMapping | undefined | null} [bracketColor] surrounding bracket color value
     * @param {WpBuildLogColorMapping | undefined | null} [msgColor] msg color value
     * @returns {string}
     */
    tag = (msg, bracketColor, msgColor) =>
    {
        return msg ? (this.withColor("[", bracketColor || this.colors[this.app.rc.colors.tagBracket] || this.colors.blue) +
                     this.withColor(msg, msgColor || this.colors.grey)  +
                     this.withColor("]", bracketColor || this.colors.blue)) : "";
    };


    /**
     * @function
     * @param {string | undefined} msg
     * @param {WpBuildLogColorMapping} color color value
     * @param {boolean} [sticky]
     * @returns {string}
     */
    withColor(msg, color, sticky) { return ("\x1B[" + color[0] + "m" + msg + (!sticky ? "\x1B[" + color[1] + "m" : "")); }


    /**
     * @param {WpBuildLogColorMapping} color color value
     * @param {string} [msg] message to include in length calculation
     * @returns {number}
     */
    withColorLength = (color, msg) => (2 + color[0].toString().length + 1 + (msg ? msg.length : 0) + 2 + color[1].toString().length + 1);


    /**
     * @function Write / log a message to the console
     * @param {string} msg
     * @param {WpBuildLogLevel} [level]
     * @param {string} [pad]
     * @param {string | undefined | null | 0 | false} [icon]
     * @param {WpBuildLogColorMapping} [color]
     */
    write = (msg, level, pad = "", icon, color) =>
    {
        if (level === undefined || level <= this.app.rc.log.level)
        {
            let envTag = "";
            const app = this.app,
                  envIsInitialized = app && app.rc && app.logger;
            if (envIsInitialized)
            {
                const envTagClr = this.getIconColorMapping(icon),
                      envTagMsgClr = app ? this.colors[app.rc.colors.buildText] : this.colors.white;
                envTag = (
                    " " + this.withColor("[", envTagClr) + app.build + this.withColor("][", envTagClr) +
                    this.withColor(app.target.toString(), envTagMsgClr) + this.withColor("]", envTagClr)
                )
                .padEnd(app.rc.log.pad.envTag + this.withColorLength(envTagMsgClr) + (this.withColorLength(envTagClr) * 3));
            }
            const envMsgClr = color || (envIsInitialized ? this.colors[app.rc.colors.default] : this.colors.grey),
                  envMsg = color || !(/\x1B\[/).test(msg) || envMsgClr[0] !== this.colorMap.system ? this.withColor(this.format(msg), envMsgClr) : this.format(msg);
            console.log(`${this.basePad}${pad}${isString(icon) ? icon : this.infoIcon}${envTag}${envMsg}`);
        }
    };

    /**
     * @function
     * Write / log a message to the console.  This function is just a wrapper for {@link write write()} that
     * satisfies the javascript `console` interface.
     * @inheritdoc
     */
    log = this.write;


    /**
     * @function
     * Write / log a message and an aligned value to the console.  The message pad space is defined
     * by .wpbuildrc.`log.pad.value` (defaults to 45)
     * @param {string} msg
     * @param {any} val
     * @param {WpBuildLogLevel} [level]
     * @param {string} [pad] Message pre-padding
     * @param {string | undefined | null | 0 | false} [icon]
     * @param {WpBuildLogColorMapping} [color]
     */
    value = (msg, val, level, pad, icon, color) =>
    {
        if (level === undefined || level <= this.app.rc.log.level)
        {
            let vMsg = (msg || ""),/** @type {RegExpExecArray | null} */match, colorSpace = 0;
            const vPad = this.app.rc.log.pad.value,
                  rgxColorStartEnd = /\x1B\[[0-9]{1,2}m(.*?)\x1B\[[0-9]{1,2}m/gi;
            while ((match = rgxColorStartEnd.exec(vMsg)) !== null) {
                colorSpace += match[0].length - match[1].length;
            }
            vMsg = vMsg.padEnd(vPad + colorSpace - (pad || "").length);
            if (val || isPrimitive(val))
            {
                const rgxColorStart = /\x1B\[[0-9]{1,2}m/,
                      maxLine = this.app.rc.log.valueMaxLineLength;
                vMsg += (!isString(val) || !rgxColorStart.test(val) ? ": " : "");
                if (isString(val) && val.replace(rgxColorStart, "").length > maxLine && !val.trim().includes("\n"))
                {
                    let xPad, clrLen,
                        v = val.substring(0, maxLine),
                        lV = v.substring(v.length - 6);
                    val = val.substring(maxLine);
                    while ((match = rgxColorStartEnd.exec(v)) !== null)
                    {
                        clrLen = match[0].length - match[1].length;
                        xPad = clrLen < val.length ? clrLen : val.length;
                        v += val.substring(0, xPad);
                        val = val.substring(xPad);
                        lV = v.substring(v.length - 6);
                    }
                    while (/\x1B/.test(lV) && !rgxColorStart.test(lV))
                    {
                        v += val.substring(0, 1);
                        val = val.substring(1);
                        lV = v.substring(v.length - 6);
                        if (rgxColorStart.test(lV) && val[0] === "]")
                        {
                            v += val.substring(0, 3);
                            val = val.substring(3);
                            lV = v.substring(v.length - 6);
                        }
                    }
                    vMsg += v;
                    this.write(vMsg, level, pad, icon, color);
                    while (val.replace(rgxColorStart, "").length > maxLine)
                    {
                        vMsg = val.substring(0, maxLine);
                        val = val.substring(maxLine);
                        lV = vMsg.substring(vMsg.length - 6);
                        while ((match = rgxColorStartEnd.exec(v)) !== null)
                        {
                            clrLen = match[0].length - match[1].length;
                            xPad = clrLen < val.length ? clrLen : val.length;
                            xPad = match[0].length - match[1].length < val.length ? match[0].length - match[1].length : val.length;
                            vMsg += val.substring(0, xPad);
                            val = val.substring(xPad);
                            lV = vMsg.substring(vMsg.length - 6);
                        }
                        while (/\x1B/.test(lV) && !rgxColorStart.test(lV))
                        {
                            vMsg += val.substring(0, 1);
                            val = val.substring(1);
                            lV = vMsg.substring(vMsg.length - 6);
                        }
                        xPad = /\x1B/.test(vMsg) ? 0 : 2;
                        vMsg = "".padStart(vPad + xPad) + vMsg;
                        this.write(vMsg, level, pad, icon, color);
                    }
                    if (val.length > 0) {
                        xPad = /\x1B/.test(val) ? 0 : 2;
                        vMsg = "".padStart(vPad + xPad) + val;
                        this.write(vMsg, level, pad, icon, color);
                    }
                    return;
                }
                else {
                    vMsg += val;
                }
            }
            else if (val === undefined) {
                vMsg += ": undefined";
            }
            else {
                vMsg += ": null";
            }
            this.write(vMsg, level, pad, icon, color);
        }
    };

    /**
     * @function
     * @param {string} hookMsg
     * @param {string} hookDsc
     * @param {WpBuildLogLevel} [level]
     * @param {string} [pad] Message pre-padding
     * @param {WpBuildLogColorMapping} [iconColor]
     * @param {WpBuildLogColorMapping} [msgColor]
     */
    valuestar = (hookMsg, hookDsc, level, pad, iconColor, msgColor) =>
    {
        const icon = this.withColor(
            this.icons.star,
            iconColor ||
            (this.app.rc.colors.valueStar ? this.colors[this.app.rc.colors.valueStar] : null) ||
            this.colors.cyan
        );
        if (this.app.rc.colors.valueStarText && this.app.rc.colors.valueStarText !== "white")
        {
            this.value(hookMsg, `${icon} ${this.withColor(hookDsc, this.colors[this.app.rc.colors.valueStarText])} ${icon}`, level, pad, 0, msgColor);
        }
        else {
            this.value(hookMsg, `${icon} ${hookDsc} ${icon}`, level, pad, undefined, msgColor);
        }
    };


    /**
     * @function
     * @param {any} msg
     * @param {string} [pad]
     */
    warning = (msg, pad = "") => this.write(msg, undefined, pad, this.icons.color.warning);

}


module.exports = WpBuildConsoleLogger;
