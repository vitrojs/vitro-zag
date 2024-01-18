import type { Machine, StateMachine as S } from '@zag-js/core'
import { $, FunctionMaybe, untrack, useCleanup, useEffect } from 'vitro'
import type { MachineOptions, Observify } from './types'

import { toRecord } from './props-map'

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
  const initialContext = Object.assign(
    untrack(() =>
      typeof props === 'function' ? props() : toRecord(props),
    ),
    assign,
  ) as TContext
  const service = machine(initialContext)
  const { state: hydratedState } = (options as any) ?? {
    context: initialContext,
  }

  const state = $(service.getState())

  useEffect(() => {
    const nextContext =
      typeof props === 'function' ? props() : toRecord(props)
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
