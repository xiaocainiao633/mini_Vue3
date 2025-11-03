import { mutableHandlers } from "./baseHandlers"
import { ReactiveFlags } from "./index"

export function reactive(target: object){
  return createReactiveObject(target,false)
}

export function isObject(value: unknown): value is Record<any,any> {
  return typeof value === 'object' && value !== null
}

// 缓存列表
const reactiveMap = new WeakMap()

function createReactiveObject(target: object, isReadonly: boolean){
  if(!isObject(target)) {
    return target
  }

  if(target[ReactiveFlags.IS_REACTIVE]) {
    return target
  }

  const existingProxy = reactiveMap.get(target)
  if(existingProxy) {
    return existingProxy
  }
  const proxy = new Proxy(target, mutableHandlers)
  reactiveMap.set(target, proxy)
  return proxy
}