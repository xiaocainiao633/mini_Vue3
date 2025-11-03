import { activeEffect, trackEffect, triggerEffects } from './effect'

const targetMap = new WeakMap()

export function createDep(cleanup: any, key: any) {
  const dep = new Map() as any
  // 为清洗依赖埋下伏笔
  dep.cleanup = cleanup
  dep.name = key
  return dep
}

// 收集依赖
// 将属性和对应的 effect 维护成映射关系，后续属性变化可以触发对应的 effect 函数重新run
export function track(target: object, type: string, key: string | symbol) {
  if(activeEffect) {
    let depsMap = targetMap.get(target)
    if(!depsMap) {
      targetMap.set(target, (depsMap = new Map()))
    }
    let dep = depsMap.get(key)
    if(!dep) {
      depsMap.set(key, (dep = createDep(() => depsMap.delete(key), key)))
    }
    trackEffect(activeEffect, dep)
  }
}

export function trigger(target: object, key? : any, newValue? : any, oldValue? : any) {
  const depsMap = targetMap.get(target)
  if(!depsMap) {
    return
  }
  let dep = depsMap.get(key)
  if(dep) {
    triggerEffects(dep)
  }
}
