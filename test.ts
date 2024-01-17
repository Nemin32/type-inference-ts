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

const constraints: Constraint[] = [[
	arrow(term(eType.int), arrow(term(eType.int), term(eType.int))), 
	arrow(term(eType.int), arrow(vari("a"), term(eType.int)))
],
	[vari("a"), term(eType.int)]

]

//console.log(constraints.map(([lhs, rhs]) => `${show(lhs)} = ${show(rhs)}`))
//console.log(unify(constraints))

// //// //

type AstConst = {type: "const", value: number | boolean}
type AstVar = {type: "var", name: string}
type AstFun = {type: "fun", arg: AstVar, body: AstExpr}
type AstApply = {type: "apply", fun: AstExpr, arg: AstExpr}
type AstIf = {type: "if", pred: AstExpr, tPath: AstExpr, fPath: AstExpr}
type AstLet = {type: "let", variable: AstVar, value: AstExpr, body: AstExpr}
type AstExpr = AstFun | AstConst | AstVar | AstApply | AstIf | AstLet

const consta = (value: number | boolean): AstConst => ({type: "const", value})
const vara = (name: string): AstVar => ({type: "var", name})
const funa = (arg: AstVar, body: AstExpr): AstFun  => ({type: "fun", arg, body})
const applya = (fun: AstExpr, arg: AstExpr): AstApply => ({type: "apply", fun, arg})
const ifa  = (pred: AstExpr, tPath: AstExpr, fPath: AstExpr): AstIf => ({type: "if", pred, tPath, fPath})
const leta = (variable: AstVar, value: AstExpr, body: AstExpr): AstLet => ({type: "let", body, value, variable})

function showAST(ast: AstExpr, indent: number = 0): string {
	const spaces = " ".repeat(indent)
	//console.log(spaces)
	switch (ast.type) {
		case "const": return spaces + String(ast.value)
		case "var": return spaces + ast.name
		case "fun": return spaces + `fun ${showAST(ast.arg)} -> ${showAST(ast.body, indent)} end`
		case "apply": return spaces + `${showAST(ast.fun)}(${showAST(ast.arg)})`
		case "if": return spaces + `if ${showAST(ast.pred)} then\n${showAST(ast.tPath, indent + 2)}\n${spaces}else\n${showAST(ast.fPath, indent + 2)}\n${spaces}end`
		case "let": return spaces + `let ${showAST(ast.variable)} = ${showAST(ast.value)} in\n${showAST(ast.body, indent + 2)}\n${spaces}end`
	}
}

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
	return solutions.reduceRight((acc, [lhs, rhs]) => substitute(rhs, lhs, acc), type)
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

class Parser {
	index: number;

	constructor(readonly input: String) {
		this.index = 0;
	}

	eof(): boolean {
		return this.index >= this.input.length;
	}

	isWhitespace(c: string): boolean {
		return c == " " || c == "\n" || c == "\t"
	}

	isSeparator(c: string): boolean {
		return this.isWhitespace(c) || c == "(" || c == ")"
	}

	isDigit(c: string): boolean {
		return c >= '0' && c <= '9';
	}

	eat() { return this.input[this.index++]; }
	match(c: string) {
		this.skipWhitespace()
		const eaten = this.eat()
		if (eaten !== c) throw new Error(`Expected '${c}', got '${eaten}': ${this.input.slice(this.index)}`)

		return eaten;
	}

	eatWhile(pred: (c: string) => boolean) 
	{ 
		let retval = ""

		while (!this.eof() && pred(this.peek())) 
		{
			retval += this.eat()	
		}

		return retval;
	}

	eatWord() {
		this.skipWhitespace()
		return this.eatWhile(c => !this.isSeparator(c));
	}

	matchWord(word: string) {
		this.skipWhitespace()
		const eaten = this.eatWord()
		if (eaten !== word) throw new Error(`Expected '${word}', got '${eaten}': ${this.input.slice(this.index)}`)

		return eaten;
	}

	skipWhitespace() {
		this.eatWhile(this.isWhitespace)
	}

	peek() { return this.input[this.index]; }

	peekWord() {
		const oldIndex = this.index;
		this.skipWhitespace()
		const retval = this.eatWord();
		this.index = oldIndex;

		return retval;
	}

	parseLet(): AstLet {
		this.matchWord("let")
		const variable = this.parseVar()
		this.match("=")
		const value = this.parse()
		this.matchWord("in")
		const body = this.parse()
		this.matchWord("end")

		return leta(variable, value, body);
	}

	parseIf(): AstIf {
		this.matchWord("if")
		const pred = this.parse()
		this.matchWord("then")
		const tPath = this.parse()
		this.matchWord("else")
		const fPath = this.parse()
		this.matchWord("end")

		return ifa(pred, tPath, fPath)
	}

	parseFun(): AstFun {
		this.matchWord("fun")
		const variable = this.parseVar()
		this.matchWord("->")
		const body = this.parse()
		this.matchWord("end")

		return funa(variable, body)
	}

	parseApply(): AstApply | AstVar {
		const variable = this.parseVar()

		const args: AstExpr[] = []

		while (this.peek() == "(") {
			this.match("(")
			args.push(this.parse())
			this.match(")")
		}

		if (args.length === 0) return variable //throw new Error("There must be at least one argument.");
		return args.reduce((app, arg) => applya(app, arg), variable) as AstApply
	}

	parseConst(): AstConst {
		this.skipWhitespace()

		const value = this.eatWord()
		if (value === "true" || value === "false") {
			return consta(value === "true");
		}

		return consta(parseInt(value));
	}

	parseVar(): AstVar {
		this.skipWhitespace()
		const name = this.eatWord()

		return vara(name);
	}

	parse(): AstExpr {
		this.skipWhitespace()
		const elem = this.peekWord()

		switch (elem) {
			case "if": return this.parseIf()
			case "let": return this.parseLet()
			case "fun": return this.parseFun()
			default: {
				if (this.isDigit(elem[0]) || elem === "true" || elem === "false") 
				{
					return this.parseConst()
				} else {
					return this.parseApply()
				}
			}
		}
	}
}

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