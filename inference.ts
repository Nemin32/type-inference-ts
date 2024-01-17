import { AstExpr, showAST } from "./ast.ts";
import type { SubstExpr, SubstScheme, SubstVar } from "./types.ts";
import { arrow, compare, eType, term, vari } from "./types.ts";
import type { Constraint } from "./unification.ts";
import { substitute, unify } from "./unification.ts";

let c = "a".charCodeAt(0)
function freeVar() {
	return vari(String.fromCharCode(c++))
}

type Binding = [string, SubstExpr]

function findBinding(bindings: Binding[], name: string) {
	for (const [bname, value] of bindings) {
		if (bname == name) return value;
	}

	throw new Error("No such binding: " + name);
}

function finalize(solutions: [SubstExpr, SubstExpr][], type: SubstExpr) {
	return solutions.reduceRight((acc, [lhs, rhs]) => substitute(rhs as SubstVar, lhs, acc), type)
}

function instantiate(generalType: SubstExpr): SubstExpr {
	if (generalType.type !== "scheme") return generalType;

	const concreteType = generalType.typeVars.reduce<SubstExpr>((acc, variable) => substitute(variable, freeVar(), acc), generalType) as SubstScheme;

	return concreteType.value
}

function generalize(constraints: Constraint[], bindings: Binding[], type: SubstExpr): SubstScheme {
	const S = unify(constraints)
	const u1 = finalize(S, type);
	const env1: Binding[] =  bindings.map(([name, binding]) => [name, finalize(S, binding)])

	function findVars(expr: SubstExpr): SubstVar[] {
		switch (expr.type) {
			case "term": return []
			case "var": return [expr]
			case "arrow": return [...findVars(expr.left), ...findVars(expr.right)]
			case "scheme": throw new Error("Can't happen")//return [...expr.typeVars, ...findVars(expr.value)]
		}
	}

	const vars = findVars(u1);
	const filtered = vars
		.filter(v => !env1.some(([name, binding]) => compare(v, binding)))
		.filter((v, index) => !vars.slice(0, index).some(other => compare(v, other)))

	return {
		type: "scheme",
		typeVars: filtered,
		value: type
	}
}

function infer(bindings: Array<Binding>, expr: AstExpr): [SubstExpr, Constraint[]] {
	switch (expr.type) {
		case "const": 
			return [term((typeof expr.value === "number") ? eType.int : eType.bool), []]

		case "var": 
			return [instantiate(findBinding(bindings, expr.name)), []]

		case "fun":
		{
			const type = freeVar()
			const [bodyType, bodyConstraints] = infer(bindings.concat([[expr.arg.name, type]]), expr.body)

			return [
				arrow(type, bodyType),
				bodyConstraints
			]
		}

		case "apply": {
			const [funcType, funcConstraints] = infer(bindings, expr.fun)
			const [argType, argConstraints] = infer(bindings, expr.arg)

			const type = freeVar()

			const newConstraints: Constraint[] = [
				[funcType, arrow(argType, type)],
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
				[predType, term(eType.bool)],
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
			const [bodyType, bodyConst] = infer(bindings.concat([[expr.variable.name, generalize(valueConst, bindings, valueType)]]), expr.body)

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
