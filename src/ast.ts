interface AstConst { type: 'const', value: number | boolean }
interface AstVar { type: 'var', name: string }
interface AstFun { type: 'fun', arg: AstVar, body: AstExpr }
interface AstApply { type: 'apply', fun: AstExpr, arg: AstExpr }
interface AstIf { type: 'if', pred: AstExpr, tPath: AstExpr, fPath: AstExpr }
interface AstLet { type: 'let', variable: AstVar, value: AstExpr, body: AstExpr }
type AstExpr = AstFun | AstConst | AstVar | AstApply | AstIf | AstLet

const makeConst = (value: number | boolean): AstConst =>
  ({ type: 'const', value })

const makeAstVar = (name: string): AstVar =>
  ({ type: 'var', name })

const makeFun = (arg: AstVar, body: AstExpr): AstFun =>
  ({ type: 'fun', arg, body })

const makeApply = (fun: AstExpr, arg: AstExpr): AstApply =>
  ({ type: 'apply', fun, arg })

const makeIf = (pred: AstExpr, tPath: AstExpr, fPath: AstExpr): AstIf =>
  ({ type: 'if', pred, tPath, fPath })

const makeLet = (variable: AstVar, value: AstExpr, body: AstExpr): AstLet =>
  ({ type: 'let', body, value, variable })

/**
 * Converts `ast` to a formatted string.
 * @param ast An AST element.
 * @param indent Optional. Used to keep track of the indentation of elements.
 * @returns A formatted string representation of `ast`.
 */
function showAST (ast: AstExpr, indent: number = 0): string {
  const spaces = ' '.repeat(indent)

  const str = (() => {
    switch (ast.type) {
      case 'const':
        return String(ast.value)

      case 'var':
        return ast.name

      case 'fun': {
        const body = showAST(ast.body, indent + 2)

        const str =
        'fun ' + showAST(ast.arg) + ' ->\n' +
        body + '\n' +
        spaces + 'end'

        return str
      }

      case 'apply':
        return `${showAST(ast.fun)}(${showAST(ast.arg)})`

      case 'if': {
        const tPath = showAST(ast.tPath, indent + 2)
        const fPath = showAST(ast.fPath, indent + 2)

        const str =
        'if ' + showAST(ast.pred) + ' then\n' +
        tPath + '\n' +
        spaces + 'else\n' +
        fPath + '\n' +
        spaces + 'end'

        return str
      }

      case 'let': {
        const str =
        'let\n' +
        showAST(ast.variable, indent + 2) + ' = ' + showAST(ast.value) + '\n' +
        spaces + 'in\n' +
        showAST(ast.body, indent + 2) + '\n' +
        spaces + 'end'

        return str
      }
    }
  })()

  return spaces + str
}

export type {
  AstExpr, AstApply, AstConst, AstFun, AstIf, AstLet, AstVar
}

export {
  makeApply as make_apply, makeConst as make_const, makeFun as make_fun, makeIf as make_if, makeLet as make_let,
  showAST, makeAstVar as make_var
}
