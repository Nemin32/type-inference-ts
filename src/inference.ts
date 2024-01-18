import { type AstExpr, showAST, AstVariant } from './ast.ts'
import { TypeVar, type TypeExpr, TypeScheme, compare, int, bool, eType, TypeVariant, TypeArrow, TypeTerm } from './types.ts'
import { substitute, type Constraint, unify } from './unification.ts'

// Type variables are generated using an ugly mutable counter. The horror...
let c = 'a'.charCodeAt(0)
/**
 * Generates a fresh type variable, guaranteed not be used before.
 * @returns A fresh type variable.
 */
function freeVar (): TypeVar {
  return new TypeVar(String.fromCharCode(c++))
}

// A binding is a type attached to a name. We use it for both the static
// environment and any additional type judgements that we make during inference.
type Binding = [string, TypeExpr]

/**
 * Searches a list of bindings, returning the appropriate type based on a
 * given name. If no such element is found, an error is thrown.
 * @param bindings The list of bindings to be searched in.
 * @param name The name of the binding we want to find.
 * @returns The type associated with `name`.
 */
function findBinding (bindings: Binding[], name: string): TypeExpr {
  for (const [bname, value] of bindings) {
    if (bname === name) return value
  }

  throw new Error('No such binding: ' + name)
}

/**
 * Takes a list of constraints and one after the other substitutes their left
 * hand sides with their right hand side in a given type.
 * @param solutions The list of constraints to be applied.
 * @param type The type that we want to make substitutions on.
 * @returns The substituted form of `type`.
 */
function finalize (
  solutions: Array<[TypeExpr, TypeExpr]>, type: TypeExpr): TypeExpr {
  return solutions
    .reduceRight((acc, [lhs, rhs]) =>
      substitute(rhs as TypeVar, lhs, acc), type)
}

/**
 * Takes a type as input. If said type is not a type scheme, this function
 * simply returns it unchanged. Otherwise we substitute all universal type vars
 * in the type with fresh ones and return a non-scheme type expression.
 * @param generalType A type expression that might be a type scheme.
 * @returns A non-scheme type.
 */
function instantiate (generalType: TypeExpr): TypeExpr {
  if (generalType.type !== TypeVariant.Scheme) return generalType

  const concreteType = generalType.typeVars
    .reduce<TypeExpr>((acc, variable) =>
    substitute(variable, freeVar(), acc), generalType) as TypeScheme

  return concreteType.value
}

/**
 * Takes a type expression and turns into a type scheme. Only those type
 * variables are turned into universal ones that are not in `env1`.
 * @param constraints The list of constraints at the time the generalization is
 * made.
 * @param bindings The list of bindings existing at the time of the
 * generalization.
 * @param type The type to be generalized.
 * @returns A type scheme with the appropriate type variables turned into
 * universal ones.
 */
function generalize (
  constraints: Constraint[],
  bindings: Binding[],
  type: TypeExpr): TypeScheme {
  const S: Constraint[] = unify(constraints)
  const u1 = finalize(S, type)
  const env1: Binding[] = bindings
    .map(([name, binding]) => [name, finalize(S, binding)])

  // This function collects all type variables found in a type expression.
  function findVars (expr: TypeExpr): TypeVar[] {
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

  // We only want those type variables that we haven't encountered yet and that
  // are not in env1.
  const filtered = vars
    .filter(v => !env1.some(([name, binding]) => compare(v, binding)))
    .filter((v, index) => !vars.slice(0, index).some(o => compare(v, o)))

  return new TypeScheme(filtered, type)
}

/**
 * The beating heart of Hindley-Milner. This algorithm takes an arbitrary AST
 * and tries to infer the types of each of its child nodes, returning either an
 * error, if program's types are inconsistent or a valid, but unfinished type,
 * along with the constraints that need to be appllied to it to get the final
 * type expression for the AST.
 * @param bindings Initially it is the static environment, later it contains
 * any subsequent type judgements we made beforehand.
 * @param expr The expression whose type we are trying to infer.
 * @returns The inferred type, along will the constraints that need to be
 * applied to it (see `finalize`) to get the final type of the expression.
 */
function infer (
  bindings: Binding[], expr: AstExpr): [TypeExpr, Constraint[]] {
  switch (expr.type) {
    // Simple values can be inferred by their value.
    case AstVariant.Const:
      return [(typeof expr.value === 'number') ? int : bool, []]

    // Inferring variables requires instantiating any type schemes encountered.
    case AstVariant.Var:
      return [instantiate(findBinding(bindings, expr.name)), []]

    case AstVariant.Fun:
    {
      // This will be the type of the argument used in the body of the function.
      const argType = freeVar()

      // Function bodies are inferred with the argument added to the bindings
      // as a fresh type variable.
      const newBindings: Binding[] = [...bindings, [expr.arg.name, argType]]
      const [bodyType, bodyConstraints] = infer(newBindings, expr.body)

      // Functions have the type `argType => bodyType`.
      // The actual function itself generates no bindings, but its body might.
      return [
        new TypeArrow(argType, bodyType),
        bodyConstraints
      ]
    }

    case AstVariant.Apply: {
      // During function application, we have to infer the type of both the
      // function itself and its argument.
      const [funcType, funcConstraints] = infer(bindings, expr.fun)
      const [argType, argConstraints] = infer(bindings, expr.arg)

      // This will end up as the type of the result of the function application.
      const resultType = freeVar()

      // Both inferring the function and its argument might generate
      // constraints, so we collect them both, along with the following:
      // funcType = argType => resultType
      const newConstraints: Constraint[] = [
        [funcType, new TypeArrow(argType, resultType)],
        ...argConstraints,
        ...funcConstraints
      ]

      return [resultType, newConstraints]
    }

    case AstVariant.If: {
      // The point of this type is to make sure both the true path and the false
      // path result in the same type.
      const ifType = freeVar()

      const [predType, predConsts] = infer(bindings, expr.pred)
      const [tType, tConsts] = infer(bindings, expr.tPath)
      const [fType, fConsts] = infer(bindings, expr.fPath)

      const constraints: Constraint[] = [
        // We expect predicates to result in booleans, not any other type.
        [predType, new TypeTerm(eType.bool)],
        // We indirectly make sure tType = fType.
        [tType, ifType],
        [fType, ifType],

        // All inferences might generate additional constraints. We gather
        // these.
        ...predConsts,
        ...tConsts,
        ...fConsts
      ]

      return [ifType, constraints]
    }

    case AstVariant.Let: {
      const [valueType, valueConst] = infer(bindings, expr.value)

      // Due to let-polymorphism, the types of the bound values must be
      // generalized.
      const generalType = generalize(valueConst, bindings, valueType)
      const newBindings: Binding[] = [
        ...bindings,
        [expr.variable.name, generalType]
      ]

      // Using the generalized type, we infer the body of the let binding.
      // This will be our returned type.
      const [bodyType, bodyConst] = infer(newBindings, expr.body)

      return [
        bodyType,
        [...valueConst, ...bodyConst]
      ]
    }
  }

  throw new Error("Can't infer: " + showAST(expr))
}

export type {
  Binding
}

export { finalize, infer }
