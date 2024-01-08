import { createNormalizer } from '@zag-js/types'
import { isString } from '@zag-js/utils'

export type PropTypes<T extends EventTarget = HTMLElement> = {
  [K in keyof JSX.IntrinsicElements]: {
    [U in keyof JSX.IntrinsicElements[K]]: JSX.IntrinsicElements[K][U] extends JSX.FunctionMaybe<
      infer R
    >
      ? Exclude<R, void>
      : JSX.IntrinsicElements[K][U]
  }
} & {
  element: {
    [K in keyof JSX.VoidHTMLAttributes<T>]: JSX.VoidHTMLAttributes<T>[K] extends JSX.FunctionMaybe<
      JSX.Nullable<infer R>
    >
      ? Exclude<R, void>
      : JSX.VoidHTMLAttributes<T>[K]
  }
  style: Record<string, string>
}

const eventMap = {
  onFocus: 'onFocusIn',
  onBlur: 'onFocusOut',
  onDoubleClick: 'onDblClick',
  onChange: 'onInput',
  defaultChecked: 'checked',
  defaultValue: 'value',
  htmlFor: 'for',
  className: 'class',
}

function toVitroProp(prop: string) {
  return prop in eventMap ? eventMap[prop] : prop
}

type Dict = Record<string, any>

export const normalizeProps = createNormalizer<PropTypes>((props: Dict) => {
  const normalized: Dict = {}

  for (const key in props) {
    const value = props[key]

    // if (key === "style" && isObject(value)) {
    //   normalized["style"] = cssify(value)
    //   continue
    // }

    if (key === 'children') {
      if (isString(value)) {
        normalized['textContent'] = value
      }
      continue
    }

    normalized[toVitroProp(key)] = value
  }
  return normalized
})
