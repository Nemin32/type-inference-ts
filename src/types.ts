enum eType {
  int,
  bool,
}

enum TypeVariant {
  Term,
  Var,
  Arrow,
  Scheme
}

class SubstTerm {
  readonly type = TypeVariant.Term
  constructor (readonly variant: eType) {}
}

class SubstTypeVar {
  readonly type = TypeVariant.Var
  constructor (readonly name: string) {}
}

class SubstArrow {
  readonly type = TypeVariant.Arrow
  constructor (readonly left: SubstExpr, readonly right: SubstExpr) {}
}

class SubstScheme {
  readonly type = TypeVariant.Scheme
  constructor (readonly typeVars: SubstTypeVar[], readonly value: SubstExpr) {}
}

type SubstExpr = SubstTerm | SubstTypeVar | SubstArrow | SubstScheme

const int = new SubstTerm(eType.int)
const bool = new SubstTerm(eType.bool)

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

  switch (lhs.type) {
    case TypeVariant.Term:
      return lhs.variant === (rhs as SubstTerm).variant

    case TypeVariant.Var:
      return lhs.name === (rhs as SubstTypeVar).name

    case TypeVariant.Arrow:
      return compare(lhs.left, (rhs as SubstArrow).left) &&
             compare(lhs.right, (rhs as SubstArrow).right)

    case TypeVariant.Scheme: throw new Error('Cannot compare type schemes.')
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
    case TypeVariant.Term: return eType[expr.variant]
    case TypeVariant.Var: return "'" + expr.name
    case TypeVariant.Arrow: return `${showType(expr.left)} => ${showType(expr.right)}`
    case TypeVariant.Scheme: {
      const typeVars = expr.typeVars.map(t => showType(t)).join(' ')
      return `${typeVars} . ${showType(expr.value)}`
    }
  }
}

/**
 * Converts a string containing a simple type's textual representation into
 * the appropriate type.
 * @param str The string representation of the type.
 * @returns Either a type term or a type variable based on `str`.
 */
function stringToType (str: string): SubstExpr {
  if (str === 'int') return int
  if (str === 'bool') return bool
  if (str[0] === "'") return new SubstTypeVar(str.slice(1))

  throw new Error("Cannot turn '" + str + "' into a type.")
}

/**
 * Converts an array of strings into a signature.
 * For instance, `["int", "int", "'a"]` would become `int => int => 'a`.
 * @param array An array of strings, that can be converted to types.
 * @returns An arrow type constructed from `array`.
 */
function arrayToArrow (array: string[]): SubstArrow {
  return array
    .map(stringToType)
    .reduceRight((acc, type) => new SubstArrow(type, acc)) as SubstArrow
}

/**
 * Converts the textual representation of a type into the type itself.
 * For instance, `"int => int => 'a"` becomes `int => int => 'a`.
 * @param str The string representation of a simple or arrow type.
 * @returns The type described by `str`.
 */
function parseType (str: string): SubstExpr {
  const arr = str.split(' => ')

  if (str.length === 0 || arr.length === 0) {
    throw new Error('String was empty.')
  }

  if (arr.length === 1) return stringToType(arr[0])

  return arrayToArrow(arr)
}

export {
  compare, eType, showType,
  int, bool, parseType, TypeVariant,
  SubstArrow, type SubstExpr, SubstScheme, SubstTypeVar, SubstTerm
}
