import { type AstExpr, showAST, AstVariant } from './ast.ts'
import { SubstTypeVar, type SubstExpr, SubstScheme, compare, int, bool, eType, TypeVariant, SubstArrow, SubstTerm } from './types.ts'
import { substitute, type Constraint, unify } from './unification.ts'

let c = 'a'.charCodeAt(0)
function freeVar (): SubstTypeVar {
  return new SubstTypeVar(String.fromCharCode(c++))
}

type Binding = [string, SubstExpr]

function findBinding (bindings: Binding[], name: string): SubstExpr {
  for (const [bname, value] of bindings) {
    if (bname === name) return value
  }

  throw new Error('No such binding: ' + name)
}

function finalize (
  solutions: Array<[SubstExpr, SubstExpr]>, type: SubstExpr): SubstExpr {
  return solutions
    .reduceRight((acc, [lhs, rhs]) =>
      substitute(rhs as SubstTypeVar, lhs, acc), type)
}

function instantiate (generalType: SubstExpr): SubstExpr {
  if (generalType.type !== TypeVariant.Scheme) return generalType

  const concreteType = generalType.typeVars
    .reduce<SubstExpr>((acc, variable) =>
    substitute(variable, freeVar(), acc), generalType) as SubstScheme

  return concreteType.value
}

function generalize (
  constraints: Constraint[],
  bindings: Binding[],
  type: SubstExpr): SubstScheme {
  const S: Constraint[] = unify(constraints)
  const u1 = finalize(S, type)
  const env1: Binding[] = bindings
    .map(([name, binding]) => [name, finalize(S, binding)])

  function findVars (expr: SubstExpr): SubstTypeVar[] {
    switch (expr.type) {
      case TypeVariant.Term:
        return []

      case TypeVariant.Var:
        return [expr]

      case TypeVariant.Arrow:
        return [...findVars(expr.left), ...findVars(expr.right)]

      case TypeVariant.Scheme:
        throw new Error("Can't happen.")
    }
  }

  const vars = findVars(u1)
  const filtered = vars
    .filter(v => !env1.some(([name, binding]) => compare(v, binding)))
    .filter((v, index) => !vars.slice(0, index).some(o => compare(v, o)))

  return new SubstScheme(filtered, type)
}

function infer (
  bindings: Binding[], expr: AstExpr): [SubstExpr, Constraint[]] {
  switch (expr.type) {
    case AstVariant.Const:
      return [(typeof expr.value === 'number') ? int : bool, []]

    case AstVariant.Var:
      return [instantiate(findBinding(bindings, expr.name)), []]

    case AstVariant.Fun:
    {
      const type = freeVar()
      const newBindings: Binding[] = [...bindings, [expr.arg.name, type]]
      const [bodyType, bodyConstraints] = infer(newBindings, expr.body)

      return [
        new SubstArrow(type, bodyType),
        bodyConstraints
      ]
    }

    case AstVariant.Apply: {
      const [funcType, funcConstraints] = infer(bindings, expr.fun)
      const [argType, argConstraints] = infer(bindings, expr.arg)

      const type = freeVar()

      const newConstraints: Constraint[] = [
        [funcType, new SubstArrow(argType, type)],
        ...argConstraints,
        ...funcConstraints
      ]

      return [type, newConstraints]
    }

    case AstVariant.If: {
      const type = freeVar()

      const [predType, predConsts] = infer(bindings, expr.pred)
      const [tType, tConsts] = infer(bindings, expr.tPath)
      const [fType, fConsts] = infer(bindings, expr.fPath)

      const constraints: Constraint[] = [
        [predType, new SubstTerm(eType.bool)],
        [tType, type],
        [fType, type],

        ...predConsts,
        ...tConsts,
        ...fConsts
      ]

      return [type, constraints]
    }

    case AstVariant.Let: {
      const [valueType, valueConst] = infer(bindings, expr.value)

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
}

export { finalize, infer }
