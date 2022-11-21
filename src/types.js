/**
 * @typedef {import('./Font.js').default} Font
 * @typedef {import('./FontStyle.js').default} FontStyle
 * @typedef {import('./FontsProvider.js').default} FontsProvider
 * @typedef {import('./Cache.js').default} Cache
 */

/**
 * @typedef {Object} FontSource
 * @property {String} source
 */

/**
 * @typedef {{[key: String]: FontSource[]}} FontSourceMap
 */

/**
 * @typedef {Object} FontMetrics
 * @property {Number} unitsPerEm
 * @property {Number} ascent
 * @property {Number} descent
 * @property {Number} capHeight
 * @property {Number} xHeight
 */

/**
 * @typedef {{[key: String]: Number}} FontFeatures
 */

/**
 * @typedef {Object} FontGlyphPos
 * @property {Object} glyph
 * @property {Number} x
 * @property {Number} y
 * @property {Number} dx
 * @property {Number} dy
 */

/**
 * @typedef {Object} FontForChar
 * @property {?Font} font
 * @property {String} char
 * @property {FontStyle} style
 * @property {Boolean} isFallback
 */

/**
 * @typedef {Object} SessionParams
 * @property {Font} renderer
 * @property {FontsProvider[]} providers
 * @property {Cache} fontCache
 * @property {{[key: String]: String[]}} familyClasses
 * @property {String[]} fallbackFamilies
 * @property {[String, String|Number]} fallbackGlyph
 * @property {String} noFontAction
 * @property {Boolean} split
 * @property {Number} decimals
 * @property {String} textAttr
 * @property {Boolean} keepFontAttrs
 * @property {Boolean} loadResources
 * @property {FontSourceMap} fonts
 * @property {Boolean} useFontFace
 * @property {Boolean} useFontFaceAjax
 * @property {String} fontsDir
 * @property {Number} fontsDirCache
 * @property {String} fontsUrl
 * @property {Number} fontsUrlCache
 * @property {String} googleApiKey
 * @property {Number} googleCache
 */

/**
 * @typedef {Object} TextGroup
 * @property {String} text
 * @property {Font} font
 * @property {FontStyle} style
 */

/**
 * @typedef {Object} SessionStatUsed
 * @property {String} family
 * @property {FontSource} variant
 * @property {Number} chars
 */

/**
 * @typedef {Object} SessionStatWarning
 * @property {String} family
 * @property {{[key: String]: Number}} axes
 * @property {FontSource} variant
 */

/**
 * @typedef {Object} SessionStatError
 * @property {String} family
 * @property {FontSource} variant
 */

/**
 * @typedef {Object} SessionStat
 * @property {Number} total
 * @property {Number} replaced
 * @property {SessionStatUsed[]} used
 * @property {Number} skipped
 * @property {String[]} missed
 * @property {SessionStatWarning[]} warnings
 * @property {SessionStatError[]} errors
 */

/**
 * @typedef {Object} SessionReplaceStat
 * @property {Map<Text, TextGroup[]>} textMap
 * @property {String[]} missed
 * @property {SessionStatWarning[]} warnings
 * @property {SessionStatError[]} errors
 */

/**
 * @typedef {Object} SessionTextStyle
 * @property {Number} size
 * @property {Number} spacing
 * @property {String} alignX
 * @property {String} alignY
 */

/**
 * @typedef {Object} SessionProcessState
 * @property {Map<String, Boolean>} missed
 * @property {Map<String, SessionStatWarning>} warnings
 * @property {Map<String, SessionStatError>} errors
 * @property {String} lastChar
 * @property {Text} lastText
 * @property {Boolean} ignore
 */

/**
 * @typedef {Object} SessionLayoutStackItem
 * @property {Text} node
 * @property {?Font} font
 * @property {?Object} glyph
 * @property {Number} size
 * @property {Number} x
 * @property {Number} y
 * @property {Number} w
 * @property {Number} spacing
 */

/**
 * @typedef {Object} SessionLayoutState
 * @property {SessionLayoutStackItem[]} stack
 * @property {Number[]} x
 * @property {Number[]} y
 * @property {Number[]} dx
 * @property {Number[]} dy
 * @property {Number} chars
 * @property {Number[]} tagStart
 * @property {SessionTextStyle} style
 * @property {Number} cx
 * @property {Number} cy
 * @property {Number} sx
 * @property {Number} xMin
 * @property {Number} xMax
 * @property {String} merge
 * @property {Text} prev
 */

export default {};