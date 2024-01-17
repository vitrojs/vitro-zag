import type { Machine, StateMachine as S } from '@zag-js/core'
import {
  $,
  FunctionMaybe,
  isObservable,
  untrack,
  useCleanup,
  useEffect,
} from 'vitro'
import type { MachineOptions, Observify } from './types'

export function copyObservableToRecord(
  o: Record<string, any>,
  assign: Record<string, any> = {},
) {
  if (!o) return { ...assign }

  const obj = {} as any
  for (const key in o) {
    const v = o[key]
    if (typeof v === 'function' && isObservable(v)) {
      obj[key] = v()
    } else {
      obj[key] = v
    }
  }
  return Object.assign(obj, assign)
}
export function useMachine<
  TContext extends Record<string, any>,
  TProps extends
    | Observify<Partial<TContext>>
    | FunctionMaybe<Partial<TContext>>,
  TState extends S.StateSchema,
  TEvent extends S.EventObject = S.AnyEventObject,
>(
  props: TProps,
  machine: (context: TContext) => Machine<TContext, TState, TEvent>,
  assign?: Partial<TContext>,
  options?: Omit<MachineOptions<TContext, TState, TEvent>, 'context'>,
) {
  const initialContext = (
    typeof props === 'function'
      ? Object.assign(props(), assign)
      : copyObservableToRecord(props, assign)
  ) as TContext
  const service = machine(initialContext)
  const { state: hydratedState } = (options as any) ?? {
    context: initialContext,
  }

  const state = $(service.getState())

  useEffect(() => {
    const nextContext =
      typeof props === 'function' ? props() : copyObservableToRecord(props)
    service.setContext(nextContext)
  })

  useEffect(
    () => {
      service.start(hydratedState)

      useCleanup(() => {
        service.stop()
      })
    },
    { sync: 'init' },
  )

  useEffect(
    () => {
      service.subscribe((nextState) => {
        state(nextState)
      })
    },
    { sync: 'init' },
  )

  return [state, service.send, service] as const
}
