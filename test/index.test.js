//@ts-nocheck
const path = require('path')
const load = require('..')

const localesDir = path.join(__dirname, './locales')
const notExistingDir = path.join(__dirname, './shit')
const filePath = path.join(__dirname, './testFile')
const invalidLocalesDir = path.join(__dirname, './invalidLocales')
const emptyDir = path.join(__dirname, './emptyDir')

describe('t18g', () => {
  describe('load function', () => {
    test('directory option', () => {
      expect(() => load()).toThrow()
      expect(() => load({})).toThrow()
      expect(() => load({ directory: 123 })).toThrow()
      expect(() => load({ directory: notExistingDir })).toThrow()
      expect(() => load({ directory: filePath })).toThrow()
      expect(() => load({ directory: localesDir })).not.toThrow()
    })

    test('defaultLocale option', () => {
      expect(() =>
        load({ directory: localesDir, defaultLocale: 'ru' }),
      ).not.toThrow()
      expect(() =>
        load({ directory: localesDir, defaultLocale: 123 }),
      ).toThrow()
      expect(() =>
        load({ directory: localesDir, defaultLocale: 'shit' }),
      ).toThrow()
    })

    test('locale files', () => {
      expect(() => load({ directory: emptyDir })).toThrow()
      expect(() => load({ directory: invalidLocalesDir })).toThrow()
    })
  })

  describe('t18g', () => {
    const t18g = load({ directory: localesDir })
    const noMissingT18g = load({ directory: localesDir, allowMissing: false })

    test('Text is different in different locales', () => {
      expect(t18g('en')`hello`).not.toBe(t18g('ru')`hello`)
    })

    test('by default missing is allowed', () => {
      expect(() => t18g()`shit`).not.toThrow()
    })

    test('no missing', () => {
      expect(() => noMissingT18g()`shit`).toThrow()
    })

    test('using default locale', () => {
      expect(t18g('ru')`done`).toBe(t18g('en')`done`)
    })
  })
})
