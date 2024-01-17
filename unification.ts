import type { SubstExpr, SubstVar } from "./types.ts";
import { arrow, compare, scheme, showType } from "./types.ts";

// A Constraint is a pair of two type expressions in the form of expr1 = expr2
// This is how we encode information about our types. For instance, if we have
//    'a = int
// and
//    'a -> 'b
// We know that the second equation is really
//    int -> 'b
type Constraint = [SubstExpr, SubstExpr];

/**
 * The algorithm recursively replaces all instances of `variable` in `expr` with `substitution`.
 * @param {SubstVar} variable The variable to be substituted.
 * @param {SubstExpr} substitution The expression that will be substituted for `variable`.
 * @param {SubstExpr} expr The expression we want to do the substitution in.
 * @returns {SubstExpr} A copy of `expr` where all instances of `variable` have been substituted for `substitution`.
 */
function substitute(variable: SubstVar, substitution: SubstExpr, expr: SubstExpr): SubstExpr {
	if (variable.type !== "var") throw new Error("Expected variable, got " + variable.type)

	switch (expr.type) {
		// Terms cannot be substituted, so they're returned as-is.
		case "term": 
			return expr;

		// We only want to replace variables that are the same as the argument `variable`.
		case "var": 
			return compare(expr, variable) ? substitution : expr;

		// In arrows we simply recurse into its left and right side, propaganting the changes until we reach a base type (`term` or `var`).
		case "arrow": return arrow(
			substitute(variable, substitution, expr.left),
			substitute(variable, substitution, expr.right),
		)

		// With type schemes, we leave the type variable alone and only substitute in the body.
		case "scheme": 
			return scheme(expr.typeVars, substitute(variable, substitution, expr.value))
	}
	
	throw new Error(`Cannot substitute! ${showType(expr)}`)
}

function unify(constraints: Constraint[]): Constraint[] {
	if (constraints.length === 0) return [];

	const [[lhs, rhs], ...rest] = constraints;

	// If lhs = rhs, then we don't need to unify them.
	if (compare(lhs, rhs)) {
		return unify(rest)
	}

	// If lhs is an arrow of lhs1 => lhs2 and rhs is an arrow of rhs1 => rhs2
	// then we can split lhs = rhs into lhs1 = rhs1 and lhs2 = rhs2
	// and thus get rid of the arrow.
	if (lhs.type === "arrow" && rhs.type === "arrow") {
		return unify(rest.concat([[lhs.left, rhs.left], [lhs.right, rhs.right]]))
	}

	// If lhs is a type variable and rhs is something else,
	// We substitute every instance of lhs as rhs in the other constraints
	// and add lhs = rhs to the unified constraints.
	if (lhs.type === "var") {
		return unify(rest.map(([left, right]) => [substitute(lhs, rhs, left), substitute(lhs, rhs, right)])).concat([[rhs, lhs]])
	}

	// If rhs is a type variable, we do the same as above, just with using lhs 
	// as the substitution.
	if (rhs.type === "var") {
		return unify(rest.map(([left, right]) => [substitute(rhs, lhs, left), substitute(rhs, lhs, right)])).concat([[lhs, rhs]])
	}

	// If none of the rules above apply, there is an inconsistency in our constraints 
	// (e.g. a type is both an int and a bool) In such cases we simply throw.
	throw new Error("Inconsistent constraints.")
}

export type {
  Constraint
};

export {
  substitute, unify
};
