import { type AstExpr, showAST, AstApply, AstConst, AstFun, AstLet, AstVar } from './ast.ts'
import { type Binding, infer, finalize } from './inference.ts'
import Parser from './parser.ts'
import { showType, parseType } from './types.ts'
import { unify } from './unification.ts'

/* const constraints: Constraint[] = [
  [parseType('int => int => int'), parseType("int => 'a => int")],
  [makeTypeVar('a'), int]
] */

// console.log(constraints.map(([lhs,rhs]) => `${showType(lhs)} = ${showType(rhs)}`))
// unify(constraints)

function run (bindings: Binding[], input: string | AstExpr): void {
  const expression = (typeof input === 'string')
    ? new Parser(input).parse()
    : input

  console.log('Running:')
  console.log(showAST(expression))
  console.log('\nInitial bindings:')
  bindings
    .forEach(([name, subst]) => { console.log(`${name}: ${showType(subst)}`) })

  const [type, constraints] = infer(bindings, expression)
  console.log('\nInferred type: ' + showType(type))
  console.log('Constraints:')
  constraints
    .map(([lhs, rhs]) => `${showType(lhs)} = ${showType(rhs)}`)
    .forEach(e => { console.log(e) })

  console.log('\nSolved constraints:')
  const solutions = unify(constraints)
  solutions
    .map(([lhs, rhs]) => `${showType(lhs)} / ${showType(rhs)}`)
    .forEach(e => { console.log(e) })

  const finalType = finalize(solutions, type)
  console.log('\nFinal type: ' + showType(finalType))
}

// run([], fun("a", consta(5)))

// fun f -> fun x -> f(x + 1)
/* const ast =
make_fun(make_var('f'),
  make_fun(make_var('x'),
    make_apply(make_var('f'),
      make_apply(make_apply(make_var('+'), make_var('x')),
        make_const(1))))) */

const ast2 =
new AstLet(new AstVar('id'), new AstFun(new AstVar('x'), new AstVar('x')),
  new AstLet(new AstVar('a'), new AstApply(new AstVar('id'), new AstConst(5)),
    new AstApply(new AstVar('id'), new AstConst(true))))

const staticEnv: Binding[] = [
  ['+', parseType('int => int => int')],
  ['*', parseType('int => int => int')],
  ['<=', parseType('int => int => bool')]
]

run(staticEnv, `
fun f -> fun x -> f(+(x)(1)) end end
`)

/* run(staticEnv, `
  let
    id = fun x -> x end
  in
    let
      a = id(true)
    in
      id(5)
    end
  end`) */
