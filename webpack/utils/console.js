/* eslint-disable import/no-extraneous-dependencies */ /* eslint-disable jsdoc/no-undefined-types */
/* eslint-disable jsdoc/require-property-description */
// @ts-check

const gradient = require("gradient-string");
const typedefs = require("../types/typedefs");
const { isString, isObject, isPrimitive } = require("./utils");


/**
 * @class WpBuildConsoleLogger
 * @implements {typedefs.IDisposable}
 */
class WpBuildConsoleLogger
{
    /**
     * The build environment that owns the `WpBuildConsoleLogger` instance
     *
     * @private
     * @type {typedefs.WpBuildApp | undefined}
     */
    app;
    /**
     * @private
     * @type {import("../types/typedefs").WpBuildLogColorMapping}
     */
    defaultColor;
    /**
     * @private
     * @type {string}
     */
    infoIcon;
    /**
     * @private
     * @type {number}
     */
    separatorLength;


    /**
     * @class WpBuildConsoleLogger
     * @param {typedefs.WpBuildApp} [app]
     */
    constructor(app)
    {
        this.app = app;
        this.separatorLength = 130;
        this.defaultColor = this.colors.cyan;
        this.infoIcon = this.icons.color.info;
        if (app && app.rc)
        {
            const infoIconClr = app.rc.log.colors.infoIcon || app.rc.log.color || app.rc.log.colors.buildBracket;
            this.infoIcon = infoIconClr ?  this.withColor(this.icons.info, this.colors[infoIconClr]) : this.icons.color.info;
            if (app.rc.log.colors.default)
            {
                Object.keys(this.colors).filter(c => this.colors[c][1] === this.colors.system).forEach((c) =>
                {
                    this.colors[c][1] = this.colorMap[app.rc.log.colors.default];
                });
            }
        }
    }

    dispose = () =>
    {
        const msg = this.withColor("force reset console color to system default", this.colors.grey);
        this.write(msg + this.withColor("", this.colors.system, true));
    };


    /**
     * @member
     * @private
     * @type {Record<typedefs.WpBuildLogTrueColor, typedefs.WpBuildLogColorValue>}
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


    /** @type {Record<typedefs.WpBuildLogColor, typedefs.WpBuildLogColorMapping>} */
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
     * @type {typedefs.WpBuildLogIconSet}
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
     * Performs inline text coloring e.g. a message can contain ""..finished italic(main module) in 2.3s"
     * @function
     * @private
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
     * @private
     * @param {string | undefined | null | 0 | false} icon
     * @returns {typedefs.WpBuildLogColorMapping}
     */
    getIconColorMapping = (icon) =>
    {
        const app = this.app,
              colors = this.colors;
        let envTagClr = app ? colors[app.rc.log.colors.buildBracket || app.rc.log.color] : colors.blue;
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
     * @static
     * @param {string} name
     * @param {string} version
     * @param {string} subtitle
     * @param {typedefs.WpBuildCallback} [cb]
     * @param {tinycolor.ColorInput[]} colors
     */
    static printBanner = (name, version, subtitle, cb, ...colors) =>
    {
        const logger = new WpBuildConsoleLogger();
        logger.sep();
        // console.log(gradient.rainbow(spmBanner(version), {interpolation: "hsv"}));
        if (colors.length === 0) {
            colors.push("red", "purple", "cyan", "pink", "green", "purple", "blue");
        }
        console.log(gradient(...colors).multiline(this.spmBanner(name, version), {interpolation: "hsv"}));
        logger.sep();
        if (subtitle) {
            logger.write(gradient("purple", "blue", "pink", "green", "purple", "blue").multiline(subtitle));
            logger.sep();
        }
        cb?.(logger);
        logger.dispose();
    };


    /**
     * @function
     */
    sep = () => this.write("-".padEnd(this.separatorLength + (!this.app ? 20 : 0), "-"));


    /**
     * @function
     * @private
     * @static
     * @param {string} name
     * @param {string} version
     * @returns {string}
     */
    static spmBanner = (name, version) =>
    {
       return `           ___ ___ _/\\ ___  __ _/^\\_ __  _ __  __________________   ____/^\\.  __//\\.____ __   ____  _____
          (   ) _ \\|  \\/  |/  _^ || '_ \\| '_ \\(  ______________  ) /  _^ | | / //\\ /  __\\:(  // __\\// ___)
          \\ (| |_) | |\\/| (  (_| || |_) ) |_) )\\ \\          /\\/ / (  (_| | ^- /|_| | ___/\\\\ // ___/| //
        ___)  ) __/|_|  | ^/\\__\\__| /__/| /__/__) ) Version \\  / /^\\__\\__| |\\ \\--._/\\____ \\\\/\\\\___ |_|
       (_____/|_|       | /       |_|   |_| (____/  ${version}   \\/ /        |/  \\:(           \\/
                        |/${name.padStart(49 - name.length)}`;
    };


    /**
     * @function
     * @param {string | undefined} msg
     * @param {typedefs.WpBuildLogLevel} [level]
     */
    start = (msg, level) =>  this.write(
        (this.app && this.app.rc.log.color ?
            this.withColor(this.icons.start, this.colors[this.app.rc.log.color]) :
            this.icons.color.start) + (msg ? "  " + msg : ""), level);


    /**
     * @function
     * @param {string | undefined} tagMsg
     * @param {typedefs.WpBuildLogColorMapping | undefined | null} [bracketColor] surrounding bracket color value
     * @param {typedefs.WpBuildLogColorMapping | undefined | null} [msgColor] msg color value
     * @returns {string}
     */
    tag = (tagMsg, bracketColor, msgColor) =>
        tagMsg ? (this.withColor("[",
                      bracketColor ||
                      (this.app && this.app.rc ? this.colors[this.app.rc.log.colors.tagBracket] : null) ||
                      (this.app && this.app.rc ? this.colors[this.app.rc.log.color] : null) ||
                      this.defaultColor
                  ) +
                 this.withColor(tagMsg, msgColor || this.colors.grey)  +
                 this.withColor("]", bracketColor || this.colors.blue)) : "";

    /**
     * @function
     * @member
     * Write / log a message and an aligned value to the console.  The message pad space is defined
     * by .wpbuildrc.`log.pad.value` (defaults to 45)
     * @param {string} msg
     * @param {any} val
     * @param {typedefs.WpBuildLogLevel} [level]
     * @param {string} [pad] Message pre-padding
     * @param {string | undefined | null | 0 | false} [icon]
     * @param {typedefs.WpBuildLogColorMapping | null} [color]
     */
    value = (msg, val, level, pad, icon, color) =>
    {
        if (level === undefined || !this.app || !this.app.rc || level <= this.app.rc.log.level)
        {
            let vMsg = (msg || ""),/** @type {RegExpExecArray | null} */match, colorSpace = 0;
            const vPad = this.app?.rc.log.pad.value || 50,
                  rgxColorStartEnd = /\x1B\[[0-9]{1,2}m(.*?)\x1B\[[0-9]{1,2}m/gi;
            while ((match = rgxColorStartEnd.exec(vMsg)) !== null) {
                colorSpace += match[0].length - match[1].length;
            }
            vMsg = vMsg.padEnd(vPad + colorSpace - (pad || "").length);
            if (val || isPrimitive(val))
            {
                const rgxColorStart = /\x1B\[[0-9]{1,2}m/,
                      maxLine = this.app?.rc.log.valueMaxLineLength || 100;
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
     * @param {string} msg
     * @param {string} dsc
     * @param {typedefs.WpBuildLogLevel} [level]
     * @param {string} [pad] Message pre-padding
     * @param {typedefs.WpBuildLogColorMapping | null} [iconColor]
     * @param {typedefs.WpBuildLogColorMapping | null} [msgColor]
     */
    valuestar = (msg, dsc, level, pad, iconColor, msgColor) =>
    {
        const icon = this.withColor(
            this.icons.star,
            iconColor ||
            (this.app && this.app.rc.log.colors.valueStar ? this.colors[this.app.rc.log.colors.valueStar] : null) ||
            (this.app && this.app.rc.log.color ? this.colors[this.app.rc.log.color] : null) ||
            this.defaultColor
        );
        if (this.app && this.app.rc.log.colors.valueStarText && this.app.rc.log.colors.valueStarText !== "white")
        {
            this.value(msg, `${icon} ${this.withColor(dsc, this.colors[this.app.rc.log.colors.valueStarText])} ${icon}`, level, pad, 0, msgColor);
        }
        else {
            this.value(msg, `${icon} ${dsc} ${icon}`, level, pad, undefined, msgColor);
        }
    };


    /**
     * @function
     * @param {any} msg
     * @param {string} [pad]
     */
    warning = (msg, pad) => this.write(msg, undefined, pad, this.icons.color.warning);

    /**
     * @function
     * @param {string | undefined} msg
     * @param {typedefs.WpBuildLogColorMapping} color color value
     * @param {boolean} [sticky]
     * @returns {string}
     */
    withColor(msg, color, sticky) { return ("\x1B[" + color[0] + "m" + msg + (!sticky ? "\x1B[" + color[1] + "m" : "")); }


    /**
     * @function
     * @private
     * @param {typedefs.WpBuildLogColorMapping} color color value
     * @param {string} [msg] message to include in length calculation
     * @returns {number}
     */
    withColorLength = (color, msg) => (2 + color[0].toString().length + 1 + (msg ? msg.length : 0) + 2 + color[1].toString().length + 1);


    /**
     * @function Write / log a message to the console
     * @param {string} msg
     * @param {typedefs.WpBuildLogLevel} [level]
     * @param {string} [pad]
     * @param {string | undefined | null | 0 | false} [icon]
     * @param {typedefs.WpBuildLogColorMapping | null} [color]
     */
    write = (msg, level, pad = "", icon, color) =>
    {
        if (level === undefined || !this.app || !this.app.rc || level <= this.app.rc.log.level)
        {
            let envTag = "";
            const app = this.app;
            if (app && app.rc)
            {
                const envTagClr = this.getIconColorMapping(icon),
                      envTagMsgClr = app ? this.colors[app.rc.log.colors.buildText] : this.colors.white;
                envTag = (
                    " " + this.withColor("[", envTagClr) + app.build.name + this.withColor("][", envTagClr) +
                    this.withColor(app.target.toString(), envTagMsgClr) + this.withColor("]", envTagClr)
                )
                .padEnd(app.rc.log.pad.envTag + this.withColorLength(envTagMsgClr) + (this.withColorLength(envTagClr) * 3));
            }
            const envMsgClr = color || (app ? this.colors[app.rc.log.colors.default] : this.colors.grey),
                  envMsg = color || !(/\x1B\[/).test(msg) || envMsgClr[0] !== this.colorMap.system ? this.withColor(this.format(msg), envMsgClr) : this.format(msg);
            console.log(`${this.app?.rc.log.pad.base || ""}${pad}${isString(icon) ? icon : this.infoIcon}${envTag}${envMsg}`);
        }
    };

    /**
     * @function
     * @param {string | undefined} msg
     * @param {string | undefined} tagMsg
     * @param {typedefs.WpBuildLogColorMapping | undefined | null} [bracketColor] surrounding bracket color value
     * @param {typedefs.WpBuildLogColorMapping | undefined | null} [msgColor] msg color value
     */
    writeMsgTag = (msg, tagMsg, bracketColor, msgColor) =>
        this.write(msg + "  " + this.tag(tagMsg, bracketColor, msgColor), 2, "", null, this.colors[this.app?.rc.log.colors.default || "grey"]);


    /**
     * @function
     * Write / log a message to the console.  This function is just a wrapper for {@link write write()} that
     * satisfies the javascript `console` interface.
     * @inheritdoc
     */
    log = this.write;
}


module.exports = WpBuildConsoleLogger;
