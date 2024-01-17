enum eType {
  int,
  bool,
}

type SubstTerm = {type: "term", variant: eType}
type SubstVar = {type: "var", name: string}
type SubstArrow = {type: "arrow", left: SubstExpr, right: SubstExpr}
type SubstScheme = {type: "scheme", typeVars: SubstVar[], value: SubstExpr}
type SubstExpr = SubstTerm | SubstVar | SubstArrow | SubstScheme

const term = (t: eType): SubstTerm => ({type: "term", variant: t})
const vari = (n: string): SubstVar => ({type: "var", name: n})
const arrow = (l: SubstExpr, r: SubstExpr): SubstArrow => ({type: "arrow", left: l, right: r})
const scheme = (typeVars: SubstVar[], value: SubstExpr): SubstScheme => ({type: "scheme", typeVars, value})

/**
 * Compares lhs and rhs by value (instead of per reference as usual in JS).
 * @param {SubstExpr} lhs - A type expression.
 * @param {SubstExpr} rhs - Another type expression.
 * @returns {boolean} Whether lhs == rhs
 */
function compare(lhs: SubstExpr, rhs: SubstExpr): boolean {
	// Because of this if, we can safely cast rhs to whichever form we want to compare with.
	// Sadly TS isn't smart enough to realize this.
	if (lhs.type !== rhs.type) return false;

	if (lhs.type === "term") 
		return lhs.variant === (rhs as SubstTerm).variant;

	if (lhs.type === "var") 
		return lhs.name === (rhs as SubstVar).name;

	if (lhs.type === "arrow")
		return compare(lhs.left, (rhs as SubstArrow).left) && 
		       compare(lhs.right, (rhs as SubstArrow).right)
	
	return false
}

/**
 * Converts a type expression into string.
 * @param {SubstExpr} expr - A type expression.
 * @returns {string} The textual representation of `expr`.
 */
function showType(expr: SubstExpr): string {
	switch (expr.type) {
		case "term": return eType[expr.variant];
		case "var": return "'" + expr.name
		case "arrow": return `${showType(expr.left)} => ${showType(expr.right)}`
		case "scheme": return `${expr.typeVars.map(t => showType(t)).join(" ")} . ${showType(expr.value)}`
	}
}

export type { SubstExpr, SubstScheme, SubstVar }

export { arrow, compare, eType, scheme, showType, term, vari }
