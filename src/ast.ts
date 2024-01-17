enum AstVariant {
  Const,
  Var,
  Fun,
  Apply,
  If,
  Let
}

class AstConst {
  readonly type = AstVariant.Const
  constructor (readonly value: number | boolean) { }
}

class AstVar {
  readonly type = AstVariant.Var
  constructor (readonly name: string) {}
}

class AstFun {
  readonly type = AstVariant.Fun
  constructor (readonly arg: AstVar, readonly body: AstExpr) { }
}

class AstApply {
  readonly type = AstVariant.Apply
  constructor (readonly fun: AstExpr, readonly arg: AstExpr) { }
}

class AstIf {
  readonly type = AstVariant.If

  constructor (
    readonly pred: AstExpr,
    readonly tPath: AstExpr,
    readonly fPath: AstExpr) { }
}

class AstLet {
  readonly type = AstVariant.Let

  constructor (
    readonly variable: AstVar,
    readonly value: AstExpr,
    readonly body: AstExpr) {}
}

type AstExpr = AstFun | AstConst | AstVar | AstApply | AstIf | AstLet

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
      case AstVariant.Const:
        return String(ast.value)

      case AstVariant.Var:
        return ast.name

      case AstVariant.Fun: {
        const body = showAST(ast.body)
        const str = 'fun ' + showAST(ast.arg) + ' -> ' + body + ' end'

        return str
      }

      case AstVariant.Apply:
        return `${showAST(ast.fun)}(${showAST(ast.arg)})`

      case AstVariant.If: {
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

      case AstVariant.Let: {
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

export {
  showAST, AstVariant,
  AstApply, AstConst, type AstExpr, AstFun, AstIf, AstVar, AstLet
}
