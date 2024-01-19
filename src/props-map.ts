import { FunctionMaybe, isObservable, useEffect, $ } from 'vitro'

export function toRecord(o: Record<string, any>) {
	if (!o) return {}

	const obj = {} as any
	for (const key in o) {
		const v = o[key]
		if (typeof v === 'function' && isObservable(v)) {
			obj[key] = v()
		} else {
			obj[key] = v
		}
	}
	return obj
}

const VITRO_MERGED_PROP = Symbol('vitro-merged-prop')

function mergeStyle(
	target: Record<string, any>,
	source: Record<string, any> | string,
) {
	const styles = target.style
	if (Array.isArray(styles)) {
		for (const it of styles) {
			if (isObservable(it) && it[VITRO_MERGED_PROP]) {
				it(source)
				return
			}
		}
		const ov = $(source)
		ov[VITRO_MERGED_PROP] = true
		styles.unshift(ov)
		return
	}
	const ov = $(source)
	ov[VITRO_MERGED_PROP] = true
	target.style = [styles, ov]
}

function mergeClass(target: Record<string, any>, source: string | string[]) {
	const clazz = target.class

	if (clazz === undefined || clazz === null) {
		target.class = source
		return
	}

	if (Array.isArray(clazz)) {
		for (const it of clazz) {
			if (isObservable(it) && it[VITRO_MERGED_PROP]) {
				it(source)
				return
			}
		}
	}
	target.class = [clazz]
	const ov = $(source)
	ov[VITRO_MERGED_PROP] = true
	target.class.unshift(ov)
}

export function mergeProps<T extends Record<string, any>>(
	target: T,
	...source: FunctionMaybe<Record<string, any>>[]
): T {
	if (!target) throw new Error('target is undefined')

	for (let i = 0; i < source.length; i++) {
		const props = source[i]

		if (typeof props === 'function') {
			useEffect(
				() => {
					const __props = props()

					for (const key in __props) {
						const val = __props[key]

						if (key === 'style') {
							mergeStyle(target, val)
						} else if (key === 'class' || key === 'className') {
							mergeClass(target, val)
						} else {
							if (typeof val === 'function') {
								// @ts-ignore
								target[key] = val
							} else {
								// @ts-ignore
								if (!target[key]) {
									// @ts-ignore
									target[key] = $(val)
								} else {
									target[key](val)
								}
							}
						}
					}
				},
				{ sync: 'init' },
			)
		} else {
			Object.assign(target, props)
		}
	}

	return target
}
