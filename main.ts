import { AstExpr, make_apply, make_const, make_fun, make_let, showAST, make_var } from "./ast.ts";
import { Binding, finalize, infer } from "./inference.ts";
import Parser from "./parser.ts";
import { showType, make_typevar, int, parseType } from "./types.ts";
import { Constraint, unify } from "./unification.ts";

const constraints: Constraint[] = [
	[parseType("int => int => int"), parseType("int => 'a => int")],
	[make_typevar("a"), int]
]


//console.log(constraints.map(([lhs,rhs]) => `${showType(lhs)} = ${showType(rhs)}`))
//unify(constraints)

function run(bindings: Binding[], input: string | AstExpr) {
	const expression = (typeof input === "string") 
		? new Parser(input).parse() 
		: input;

	console.log("Running:")
	console.log(showAST(expression))
	console.log("\nInitial bindings:")
	bindings
		.forEach(([name, subst]) => console.log(`${name}: ${showType(subst)}`))

	const [type, constraints] = infer(bindings, expression)
	console.log("\nInferred type: " + showType(type))
	console.log("Constraints:")
	constraints
		.forEach(([lhs, rhs]) => console.log(`${showType(lhs)} = ${showType(rhs)}`))

	console.log("\nSolved constraints:")
	const solutions = unify(constraints)
	solutions
		.forEach(([lhs, rhs]) => console.log(`${showType(lhs)} / ${showType(rhs)}`))

	const finalType = finalize(solutions, type)
	console.log("\nFinal type: " + showType(finalType))
}

//run([], fun("a", consta(5)))

// fun f -> fun x -> f(x + 1)
const ast = 
make_fun(make_var("f"), 
	make_fun(make_var("x"), 
		make_apply(make_var("f"), 
							 make_apply(make_apply(make_var("+"), make_var("x")), 
							 						make_const(1)))))

const ast2 =
make_let(make_var("id"), make_fun(make_var("x"), make_var("x")),
	make_let(make_var("a"), make_apply(make_var("id"), make_const(5)),
		make_apply(make_var("id"), make_const(true))))

const staticEnv: Binding[] = [
	["+", parseType("int => int => int")],
	["*", parseType("int => int => int")],
	["<=", parseType("int => int => bool")],
]

run(staticEnv, ast2)

/*run(staticEnv, `
	let 
		id = fun x -> x end 
	in 
		let 
			a = id(true) 
		in 
			id(5) 
		end 
	end`)*/