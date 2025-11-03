import { ReactiveFlags } from './index'
import { track, trigger } from './reactiveEffect'
import { isObject, reactive } from './reactivity'

// 基础的 mutableHandlers
export const mutableHandlers: ProxyHandler<object> = {
  get(target, key,receiver) {
    if(key === ReactiveFlags.IS_REACTIVE) {
      return true
    }
    const res = Reflect.get(target, key, receiver)
    track(target, 'get', key)
    // 当取值时返回的值是对象，则返回这个对象的代理对象，从而实现深度代理
    if(isObject(res)) {
      return reactive(res)
    }
    return res
  },
  set(target, key, value, receiver) {
    const oldValue = Reflect.get(target, key)
    const result = Reflect.set(target, key, value, receiver)
    if (oldValue !== value) {
      trigger(target, key, value, oldValue)
    }
    return result
  }
}