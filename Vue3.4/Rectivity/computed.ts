// computed实现原理：接受一个getter函数，并根据返回值返回一个不可变的ref对象
import { ReactiveEffect } from './effect'
import { triggerRefValue, trackRefValue } from './ref'

// 计算属性对象
class ComputedRefImpl {
  public effect
  public _value: any
  public dep: any
  public __v_isRef = true
  public rawValue: any
  public _shallow = false

  constructor(getter: (arg0: any) => any, public setter: any)  {
    this.effect = new ReactiveEffect(
      () => getter(this._value), // 计算属性依赖的值会对计算属性effect进行收集
      () => triggerRefValue(this) // 计算属性依赖的值变化后会触发此函数
    )
  }

  get value() {
    if(this.effect.dirty && !Object.is(this._value, (this._value = this.effect.run()))) {
      // 取值时进行依赖收集
      trackRefValue(this)
    }
    return this._value
  }
  set value(newValue) {
    this.setter(newValue)
  }
}

// computed函数
export function computed(getterOrOptions: any) {
  // 传入的函数就是getter
  const onlyGetter = isFunction(getterOrOptions)
  let getter;
	let setter;
	if (onlyGetter) {
		getter = getterOrOptions;
		setter = () => {};
	} else {
		getter = getterOrOptions.get;
		setter = getterOrOptions.set;
	}
	// 创建计算属性
	return new ComputedRefImpl(getter, setter);
}

export function isFunction(fn: unknown): fn is Function {
  return typeof fn === 'function'
}