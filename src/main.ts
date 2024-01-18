import { type AstExpr, showAST } from './ast.ts'
import { type Binding, infer, finalize } from './inference.ts'
import Parser from './parser.ts'
import { showType, parseType } from './types.ts'
import { unify } from './unification.ts'

/**
 * Given an input and a static environemnt, the code calls the appropriate
 * functions to infer the type of input and print the internals of the process.
 * @param bindings A static environment we want to feed to HM.
 * @param input Either an AST or a string to be parsed into an AST.
 */
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

// Here's a small example if you want to manually unify some constraints.
/* const constraints: Constraint[] = [
  [parseType('int => int => int'), parseType("int => 'a => int")],
  [makeTypeVar('a'), int]
] */

// console.log(constraints.map(([lhs,rhs]) => `${showType(lhs)} = ${showType(rhs)}`))
// unify(constraints)

// Hey, this one should be familiar!
// fun f -> fun x -> f(x + 1) end end
/* const ast =
make_fun(make_var('f'),
  make_fun(make_var('x'),
    make_apply(make_var('f'),
      make_apply(make_apply(make_var('+'), make_var('x')),
        make_const(1))))) */

// A really minimal static environment, containing only three operators.
// You could add here any kind of type really with any name.
const staticEnv: Binding[] = [
  ['+', parseType('int => int => int')],
  ['*', parseType('int => int => int')],
  ['<=', parseType('int => int => bool')]
]

// Let-polymorphism just works.
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
