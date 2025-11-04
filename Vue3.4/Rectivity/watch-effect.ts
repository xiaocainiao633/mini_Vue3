import { isReactive, isObject } from './reactivity'
import { isFunction } from './computed'
import { ReactiveEffect } from './effect'

export function watch(source: any, cb: any, options = {}) {
  return doWatch(source, cb, options as any)
}

export function watchEffect(source: any, cb: null, options: any) {
  return doWatch(source, cb, options as any)
}

function doWatch(source: any, cb: any, { deep, immediate }: any) {
  let getter
  // 将对象转为getter函数
  const reactiveGetter = (source: any) => {
    traverse(source, deep === false ? 1 : undefined)
  }
  // 如果是响应式对象
  if(isReactive(source)) {
    // 根据深度创建getter
    getter = () => reactiveGetter(source)
  } else if (isFunction(source)) {
    getter = source
  }

  let oldValue: any
  let cleanup: any
  let onCleanup = (fn: Function) => {
    cleanup = () => {
      fn()
      cleanup = undefined
    }
  }

  const job = () => {
    if(cb) {
      const newValue = effect.run()
      if(cleanup) {
        cleanup()
      }
      cb(newValue, oldValue)
      oldValue = newValue
    } else {
      effect.run()
    }
  }

  const effect = new ReactiveEffect(getter, job)
  oldValue = effect.run()
  if(cb) {
    if(immediate) {
      job()
    } else{
      oldValue = effect.run()
    }
  } else{
    effect.run()
  }

  const unwatch = () => {
    effect.stop()
  }
  return unwatch
}

// 遍历属性，会触发proxy中的get方法
function traverse(value: any, depth: any, currentDepth = 0, seen = new Set()) {
  if(!isObject(value)) {
    return value
  }
  if(depth) {
    // 记录遍历的深度
    if(currentDepth >= depth) {
      return value
    }
    currentDepth++
  }
  if(seen.has(value)) {
    return value
  }
  seen.add(value)
  for(const k in value) {
    traverse(value[k], depth, currentDepth, seen)
  }
  return value
}
