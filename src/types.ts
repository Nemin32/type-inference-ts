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

class TypeTerm {
  readonly type = TypeVariant.Term
  constructor (readonly variant: eType) {}
}

class TypeVar {
  readonly type = TypeVariant.Var
  constructor (readonly name: string) {}
}

class TypeArrow {
  readonly type = TypeVariant.Arrow
  constructor (readonly left: TypeExpr, readonly right: TypeExpr) {}
}

class TypeScheme {
  readonly type = TypeVariant.Scheme
  constructor (readonly typeVars: TypeVar[], readonly value: TypeExpr) {}
}

type TypeExpr = TypeTerm | TypeVar | TypeArrow | TypeScheme

const int = new TypeTerm(eType.int)
const bool = new TypeTerm(eType.bool)

/**
 * Compares lhs and rhs by value (instead of per reference as usual in JS).
 * @param {TypeExpr} lhs - A type expression.
 * @param {TypeExpr} rhs - Another type expression.
 * @returns {boolean} Whether lhs == rhs
 */
function compare (lhs: TypeExpr, rhs: TypeExpr): boolean {
  // Because of this if, we can safely cast rhs to whichever form we
  // want to compare with. Sadly TS isn't smart enough to realize this itself.
  if (lhs.type !== rhs.type) return false

  switch (lhs.type) {
    case TypeVariant.Term:
      return lhs.variant === (rhs as TypeTerm).variant

    case TypeVariant.Var:
      return lhs.name === (rhs as TypeVar).name

    case TypeVariant.Arrow:
      return compare(lhs.left, (rhs as TypeArrow).left) &&
             compare(lhs.right, (rhs as TypeArrow).right)

    case TypeVariant.Scheme: throw new Error('Cannot compare type schemes.')
  }

  return false
}

/**
 * Converts a type expression into string.
 * @param {TypeExpr} expr - A type expression.
 * @returns {string} The textual representation of `expr`.
 */
function showType (expr: TypeExpr): string {
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
function stringToType (str: string): TypeExpr {
  if (str === 'int') return int
  if (str === 'bool') return bool
  if (str[0] === "'") return new TypeVar(str.slice(1))

  throw new Error("Cannot turn '" + str + "' into a type.")
}

/**
 * Converts an array of strings into a signature.
 * For instance, `["int", "int", "'a"]` would become `int => int => 'a`.
 * @param array An array of strings, that can be converted to types.
 * @returns An arrow type constructed from `array`.
 */
function arrayToArrow (array: string[]): TypeArrow {
  return array
    .map(stringToType)
    .reduceRight((acc, type) => new TypeArrow(type, acc)) as TypeArrow
}

/**
 * Converts the textual representation of a type into the type itself.
 * For instance, `"int => int => 'a"` becomes `int => int => 'a`.
 * @param str The string representation of a simple or arrow type.
 * @returns The type described by `str`.
 */
function parseType (str: string): TypeExpr {
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
  TypeArrow, type TypeExpr, TypeScheme, TypeVar, TypeTerm
}
