import { AstExpr, showAST } from "./ast.ts";
import type { SubstExpr, SubstScheme, SubstTypeVar } from "./types.ts";
import { make_arrow, compare, eType, make_term, make_typevar, make_scheme, int, bool } from "./types.ts";
import type { Constraint } from "./unification.ts";
import { substitute, unify } from "./unification.ts";

let c = "a".charCodeAt(0)
function freeVar() {
	return make_typevar(String.fromCharCode(c++))
}

type Binding = [string, SubstExpr]

function findBinding(bindings: Binding[], name: string) {
	for (const [bname, value] of bindings) {
		if (bname == name) return value;
	}

	throw new Error("No such binding: " + name);
}

function finalize(solutions: [SubstExpr, SubstExpr][], type: SubstExpr) {
	return solutions
		.reduceRight((acc, [lhs, rhs]) => 
			substitute(rhs as SubstTypeVar, lhs, acc), type)
}

function instantiate(generalType: SubstExpr): SubstExpr {
	if (generalType.type !== "scheme") return generalType;

	const concreteType = generalType.typeVars
		.reduce<SubstExpr>((acc, variable) => 
			substitute(variable, freeVar(), acc), generalType) as SubstScheme;

	return concreteType.value
}

function generalize(
	constraints: Constraint[], 
	bindings: Binding[], 
	type: SubstExpr): SubstScheme {
	const S = unify(constraints)
	const u1 = finalize(S, type);
	const env1: Binding[] = bindings
		.map(([name, binding]) => [name, finalize(S, binding)])

	function findVars(expr: SubstExpr): SubstTypeVar[] {
		switch (expr.type) {
			case "term": return []
			case "var": return [expr]
			case "arrow": return [...findVars(expr.left), ...findVars(expr.right)]
			case "scheme": throw new Error("Can't happen.")
		}
	}

	const vars = findVars(u1);
	const filtered = vars
		.filter(v => !env1.some(([name, binding]) => compare(v, binding)))
		.filter((v, index) => !vars.slice(0, index).some(o => compare(v, o)))

	return make_scheme(filtered, type)
}

function infer(
	bindings: Array<Binding>, expr: AstExpr): [SubstExpr, Constraint[]] {
	switch (expr.type) {
		case "const": 
			return [(typeof expr.value === "number") ? int : bool, []]

		case "var": 
			return [instantiate(findBinding(bindings, expr.name)), []]

		case "fun":
		{
			const type = freeVar()
			const newBindings: Binding[] = [...bindings, [expr.arg.name, type]]
			const [bodyType, bodyConstraints] = infer(newBindings, expr.body)

			return [
				make_arrow(type, bodyType),
				bodyConstraints
			]
		}

		case "apply": {
			const [funcType, funcConstraints] = infer(bindings, expr.fun)
			const [argType, argConstraints] = infer(bindings, expr.arg)

			const type = freeVar()

			const newConstraints: Constraint[] = [
				[funcType, make_arrow(argType, type)],
				...argConstraints,
				...funcConstraints
			]

			return [type, newConstraints]
		}

		case "if": {
			const type = freeVar()

			const [predType, predConsts] = infer(bindings, expr.pred);
			const [tType, tConsts] = infer(bindings, expr.tPath);
			const [fType, fConsts] = infer(bindings, expr.fPath);

			const constraints: Constraint[] = [
				[predType, make_term(eType.bool)],
				[tType, type],
				[fType, type],

				...predConsts,
				...tConsts,
				...fConsts
			]

			return [type, constraints]
		}

		case "let": {
			const [valueType, valueConst] = infer(bindings, expr.value);

			const generalType = generalize(valueConst, bindings, valueType)
			const newBindings: Binding[] = [
				...bindings,
				[expr.variable.name, generalType]
			]

			const [bodyType, bodyConst] = infer(newBindings, expr.body)

			return [
				bodyType,
				[
					...valueConst, 
					...bodyConst
				]
			]
		}
	}

	throw new Error("Can't infer: " + showAST(expr))
}

export type {
	Binding
};

export { finalize, infer };
