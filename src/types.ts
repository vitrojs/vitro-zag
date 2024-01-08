import type { StateMachine as S } from '@zag-js/core'
import { FunctionMaybe } from 'vitro'

export type ValidComponent = keyof JSX.IntrinsicElements | JSX.Component<any>

export type ComponentProps<T extends ValidComponent> = T extends JSX.Component<
  infer P
>
  ? P
  : T extends keyof JSX.IntrinsicElements
    ? JSX.IntrinsicElements[T]
    : Record<string, unknown>

export type Observify<T extends Record<string, any>> = {
  [K in keyof T]: T[K] extends (...args: any) => any
    ? T[K]
    : T[K] extends FunctionMaybe<infer R>
      ? FunctionMaybe<R>
      : T[K]
}

export type MachineOptions<
  TContext extends Record<string, any>,
  TState extends S.StateSchema,
  TEvent extends S.EventObject = S.AnyEventObject,
> = Omit<S.HookOptions<TContext, TState, TEvent>, 'context'> & {
  context?: FunctionMaybe<Partial<TContext>>
}
