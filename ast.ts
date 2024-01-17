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

export type {
	AstExpr, AstApply, AstConst, AstFun, AstIf, AstLet, AstVar
}

export {
	applya, consta, funa, ifa, leta,
	showAST, vara
}
