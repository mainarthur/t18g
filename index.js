const fs = require('fs')
const path = require('path')

const { JSON_EXT, DECIMAL_RADIX } = require('./constants')

// Matches "{0}", "{1}" for formatting
const insertionRegexp = /\{\d+\}/g

/**
 *
 * @param {Object} options
 * @param {String} options.directory
 * @param {Boolean} [options.allowMissing=true]
 * @param {String} [options.defaultLocale='en']
 * @returns
 */
function load({ directory, allowMissing = true, defaultLocale = 'en' }) {
  if (!directory) throw new Error('options.directory is required')
  if (typeof directory !== 'string')
    throw new Error('options.directory should be a string')

  if (defaultLocale && !(typeof directory === 'string'))
    throw new Error('options.defaultLocale should be a string')

  const locales = fs
    .readdirSync(directory)
    .filter((fileName) => path.extname(fileName) === JSON_EXT)
    .reduce((acc, locale) => {
      acc[path.basename(locale, JSON_EXT)] = JSON.parse(
        fs.readFileSync(path.join(directory, locale), 'utf-8'),
      )

      return acc
    }, {})

  if (!locales[defaultLocale]) throw new Error('Default locale is not loaded')

  // Checking locales object structure

  const localesNames = Object.keys(locales)

  if (localesNames.length === 0) throw new Error('There are no locales to load')

  localesNames.forEach((locale) => {
    if (!locales[locale]) throw new Error(`locale["${locale}"] is not defined`)
    if (typeof locales[locale] !== 'object' || Array.isArray(locales[locale]))
      throw new Error(`locale["${locale}"] is not object`)

    Object.keys(locales[locale]).forEach((textKey) => {
      if (!locales[locale][textKey])
        throw new Error(`locale["${locale}"]["${textKey}"] is not defined`)
      if (typeof locales[locale][textKey] !== 'string')
        throw new Error(`locale["${locale}"]["${textKey}"] is not string`)
    })
  })

  /**
   *
   * @param {string} locale
   * @returns {(keys: TemplateStringsArray, ...substitutions: any[]) => string}
   */
  function t18g(locale) {
    return (keys, ...substitutions) => {
      const key = keys
        .filter((key) => !!key.trim())
        .join('')
        .trim()

      /**
       * @type {string}
       */
      const text =
        locales?.[locale]?.[key] ??
        (allowMissing && locales?.[defaultLocale]?.[key])

      if (!allowMissing && !text)
        throw new Error(
          `Text with "${key}" key not found in "${locale}" locale`,
        )

      if (!text) return `{${key}}`

      const insertionsMatch = text.match(insertionRegexp)

      if (!(insertionsMatch && substitutions.length)) return text

      const insertions = insertionsMatch.map((insertion) => ({
        index: parseInt(
          insertion.substring(1, insertion.length),
          DECIMAL_RADIX,
        ),
        insertion,
      }))

      return insertions.reduce(
        (oldText, { insertion, index }) =>
          oldText.replace(insertion, substitutions[index]),
        text,
      )
    }
  }

  t18g.locales = locales

  return t18g
}

module.exports = load
