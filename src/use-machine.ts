import type { Machine, StateMachine as S } from '@zag-js/core'
import { $, untrack, useCleanup, useEffect, isObservable } from 'vitro'
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
  TProps extends Observify<Partial<TContext>>,
  TState extends S.StateSchema,
  TEvent extends S.EventObject = S.AnyEventObject,
>(
  props: TProps,
  machine: (context: TContext) => Machine<TContext, TState, TEvent>,
  assign?: Partial<TContext>,
  options?: Omit<MachineOptions<TContext, TState, TEvent>, 'context'>,
) {
  const plainContext = untrack(() => copyObservableToRecord(props, assign))
  const service = machine(plainContext)
  const { state: hydratedState } = (options as any) ?? {
    context: plainContext,
  }
  const state = $(service.getState())
  useEffect(
    () => {
      service.start(hydratedState)

      useCleanup(() => {
        service.stop()
      })
    },
    { sync: 'init' },
  )

  useEffect(() => {
    const nextContext = copyObservableToRecord(props)
    service.setContext(nextContext)
  })

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
