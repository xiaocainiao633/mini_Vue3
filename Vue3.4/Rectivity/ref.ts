import { reactive, isObject } from './reactivity'
import { activeEffect, trackEffect, triggerEffects } from './effect'
import { createDep } from './reactiveEffect'

function createRef(rawValue: any, shallow: boolean) {
  return new RefImpl(rawValue, shallow)
}

// 将原始值转换为 ref 对象
export function ref(value: any) {
  return createRef(value, false)
}

// shallowRef 对象
export function shallowRef(value: any) {
  return createRef(value, true)
}

// toReactive 函数，将值转换为响应式对象
export function toReactive(value: any) {
  return isObject(value) ? reactive(value) : value
}

// RefImpl 类，实现 ref 对象
class RefImpl {
  // value 属性
  public _value: any
  // dep 属性，用于收集依赖
  public dep = undefined
  // 表示这是一个 ref 对象
  public __v_isRef = true
  constructor(public rawValue: any, public _shallow: boolean){
    this._value = _shallow ? rawValue : toReactive(rawValue)
  }
  get value() {
    trackRefValue(this)
    return this._value
  }
  set value(newVal) {
    if(newVal !== this.rawValue) {
      this.rawValue = newVal
      this._value = this._shallow ? newVal : toReactive(newVal)
      // 触发依赖
      triggerRefValue(this)
    }
  }
}

// 收集 ref 的依赖
export function trackRefValue(ref: RefImpl) {
  if(activeEffect) {
    trackEffect(
      activeEffect,
      (ref.dep = createDep(() => (ref.dep = undefined), undefined))
    )
  }
}

// 触发 ref 的依赖
export function triggerRefValue(ref: RefImpl) {
  const dep = ref.dep
  if(dep) {
    triggerEffects(dep)
  }
}

// 解决reactive解构丢失响应式问题

class ObjectRefImpl {
  public __v_isRef = true
  constructor(public _object: Record<string | symbol, any>, public _key: string | symbol){}
  get value() {
    return this._object[this._key]
  }
  set value(newVal: any) {
    this._object[this._key] = newVal
  }
}

// toRef函数，将对象的某个属性转换为ref对象
export function toRef(object: object, key: string) {
  return new ObjectRefImpl(object as Record<string | symbol, any>, key)
}

// toRefs函数，将对象的所有属性转换为ref对象
export function toRefs(object: object) {
  const ret: any = Array.isArray(object) ? new Array((object as Array<any>).length) : {}
  for(const key in object) {
    ret[key] = toRef(object, key)
  }
  return ret
}

// proxyRefs函数，自动解包ref对象
export function proxyRefs<T extends Record<string | symbol, any>>(objectWithRefs: T) {
  // 代理的思想，如果这是ref对象，就返回.value，否则返回原值
  return new Proxy(objectWithRefs, {
    get(target, key, receiver) {
      const v = Reflect.get(target, key, receiver)
      return v && (v as any).__v_isRef ? (v as any).value : v
    },
    set(target, key, value, receiver) {
      const oldValue = (target as Record<string | symbol, any>)[key]
      if (oldValue && (oldValue as any).__v_isRef) {
        oldValue.value = value
        return true
      } else {
        return Reflect.set(target, key, value, receiver)
      }
    }
  })
}