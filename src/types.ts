enum eType {
  int,
  bool,
}

interface SubstTerm { type: 'term', variant: eType }
interface SubstTypeVar { type: 'var', name: string }
interface SubstArrow { type: 'arrow', left: SubstExpr, right: SubstExpr }
interface SubstScheme { type: 'scheme', typeVars: SubstTypeVar[], value: SubstExpr }
type SubstExpr = SubstTerm | SubstTypeVar | SubstArrow | SubstScheme

const makeTerm = (t: eType): SubstTerm =>
  ({ type: 'term', variant: t })

const makeTypeVar = (n: string): SubstTypeVar =>
  ({ type: 'var', name: n })

const makeArrow = (l: SubstExpr, r: SubstExpr): SubstArrow =>
  ({ type: 'arrow', left: l, right: r })

const makeScheme = (typeVars: SubstTypeVar[], value: SubstExpr): SubstScheme =>
  ({ type: 'scheme', typeVars, value })

const int = makeTerm(eType.int)
const bool = makeTerm(eType.bool)

/**
 * Compares lhs and rhs by value (instead of per reference as usual in JS).
 * @param {SubstExpr} lhs - A type expression.
 * @param {SubstExpr} rhs - Another type expression.
 * @returns {boolean} Whether lhs == rhs
 */
function compare (lhs: SubstExpr, rhs: SubstExpr): boolean {
  // Because of this if, we can safely cast rhs to whichever form we
  // want to compare with. Sadly TS isn't smart enough to realize this itself.
  if (lhs.type !== rhs.type) return false

  if (lhs.type === 'term') { return lhs.variant === (rhs as SubstTerm).variant }

  if (lhs.type === 'var') { return lhs.name === (rhs as SubstTypeVar).name }

  if (lhs.type === 'arrow') {
    return compare(lhs.left, (rhs as SubstArrow).left) &&
           compare(lhs.right, (rhs as SubstArrow).right)
  }

  return false
}

/**
 * Converts a type expression into string.
 * @param {SubstExpr} expr - A type expression.
 * @returns {string} The textual representation of `expr`.
 */
function showType (expr: SubstExpr): string {
  switch (expr.type) {
    case 'term': return eType[expr.variant]
    case 'var': return "'" + expr.name
    case 'arrow': return `${showType(expr.left)} => ${showType(expr.right)}`
    case 'scheme': {
      const typeVars = expr.typeVars.map(t => showType(t)).join(' ')
      return `${typeVars} . ${showType(expr.value)}`
    }
  }
}

function stringToType (str: string): SubstExpr {
  if (str === 'int') return int
  if (str === 'bool') return bool
  if (str[0] === "'") return makeTypeVar(str.slice(1))

  throw new Error("Cannot turn '" + str + "' into a type.")
}

function arrayToArrow (array: string[]): SubstArrow {
  return array
    .map(stringToType)
    .reduceRight((acc, type) => makeArrow(type, acc)) as SubstArrow
}

function parseType (str: string): SubstExpr {
  const arr = str.split(' => ')

  if (str.length === 0 || arr.length === 0) throw new Error('String was empty.')

  if (arr.length === 1) return stringToType(arr[0])

  return arrayToArrow(arr)
}

export type { SubstExpr, SubstScheme, SubstTypeVar, SubstArrow }

export {
  makeArrow, compare, eType, makeScheme, showType, makeTerm,
  makeTypeVar, int, bool, parseType
}
