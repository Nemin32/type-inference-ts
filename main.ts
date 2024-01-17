import { AstExpr, applya, consta, funa, ifa, leta, showAST, vara } from "./ast.ts";
import { Binding, finalize, infer } from "./inference.ts";
import Parser from "./parser.ts";
import { arrow, eType, showType, term, vari } from "./types.ts";
import { Constraint, unify } from "./unification.ts";


const constraints: Constraint[] = [[
	arrow(term(eType.int), arrow(term(eType.int), term(eType.int))), 
	arrow(term(eType.int), arrow(vari("a"), term(eType.int)))
],
	[vari("a"), term(eType.int)]

]

function run(bindings: Binding[], input: string | AstExpr) {
	const expression = (typeof input === "string") ? new Parser(input).parse() : input;

	console.log("Running:")
	console.log(showAST(expression))
	console.log("\nInitial bindings:")
	bindings.forEach(([name, subst]) => console.log(`${name}: ${showType(subst)}`))

	const [type, constraints] = infer(bindings, expression)
	console.log("\nInferred type: " + showType(type))
	console.log("Constraints:")
	constraints.forEach(([lhs, rhs]) => console.log(`${showType(lhs)} = ${showType(rhs)}`))

	console.log("\nSolved constraints:")
	const solutions = unify(constraints)
	solutions.forEach(([lhs, rhs]) => console.log(`${showType(lhs)} / ${showType(rhs)}`))

	const finalType = finalize(solutions, type)
	console.log("\nFinal type: " + showType(finalType))
}

//run([], fun("a", consta(5)))

// fun f -> fun x -> f(x + 1)
const ast = funa(vara("f"), funa(vara("x"), applya(vara("f"), applya(applya(vara("+"), vara("x")), consta(1)))))

// fun f -> 
// 	fun x -> 
// 		if f(x) <= 5 then 
// 			x * 5 
//    else 
//      f(x) 
//    end
const ast2 = 
funa(vara("f"), 
	funa(vara("x"),
		ifa(applya(applya(vara("<="), applya(vara("f"), vara("x"))), consta(5)),
			applya(applya(vara("*"), vara("x")), consta(5)),
			applya(vara("f"), vara("x")))))

const ast3 =
leta(vara("id"), funa(vara("x"), vara("x")),
	leta(vara("a"), applya(vara("id"), consta(5)),
		applya(vara("id"), consta(true))))

const staticEnv: Binding[] = [
	["+", arrow(term(eType.int), arrow(term(eType.int), term(eType.int)))],
	["*", arrow(term(eType.int), arrow(term(eType.int), term(eType.int)))],
	["<=", arrow(term(eType.int), arrow(term(eType.int), term(eType.bool)))],
]

// run(staticEnv, ast2)

run(staticEnv, `
	let 
		id = fun x -> x end 
	in 
		let 
			a = id(true) 
		in 
			id(5) 
		end 
	end`)