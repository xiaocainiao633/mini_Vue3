// 当前正在执行的副作用函数
import { DirtyLevels } from './index'

export let activeEffect: ReactiveEffect | undefined = undefined

// 响应式副作用函数对象
export class ReactiveEffect {
  _runnings = 0 //用于标识当前副作用函数是否正在执行
  _depsLength = 0 //用于记录本次执行访问的依赖的个数
  _trackId = 0 //用于标识该副作用函数是否被追踪过
  active = true
  _dirtyLevel = DirtyLevels.Dirty
  deps: Array<Map<ReactiveEffect, number>> = [] // 收集effect中用到的属性
  // fn: 用户传入的函数, scheduler: 调度函数
  constructor(public fn: () => any, public scheduler: () => void){}

  public get dirty() {
    return this._dirtyLevel === DirtyLevels.Dirty
  }

  public set dirty(v) {
    this._dirtyLevel = v ? DirtyLevels.Dirty : DirtyLevels.NotDirty
  }

  // 执行副作用函数
  run() {
    this._dirtyLevel = DirtyLevels.NotDirty // 运行一次后，脏值变为不脏
    if(!this.active) {
      // 如果没有激活, 直接执行副作用函数
      return this.fn()
    }
    let lastEffect = activeEffect
    try {
      // 赋值当前激活的副作用函数
      // 当 fn 执行过程中访问响应式属性时，属性会通过 activeEffect 找到当前副作用，并将其添加到自己的依赖列表（即 deps）中
      activeEffect = this
      this._runnings++
      // 每次渲染前，先清除之前的依赖
      preCleanupEffect(this)
      return this.fn()
    } finally {
      // 恢复上一个激活的副作用函数
      postCleanupEffect(this)
      this._runnings--
      activeEffect = lastEffect
    }
  }

  // trigger 
  public trigger() {
    
  }
}

// 执行函数前，清除之前的依赖
function preCleanupEffect(effect: ReactiveEffect) {
// 执行函数前，清除之前的依赖
  effect._trackId++
  effect._depsLength = 0
}

// 执行函数后
function postCleanupEffect(effect: ReactiveEffect) {
  // 重新收集之后，看依赖列表有没有增加，有增加就要删除
  if(effect.deps.length > effect._depsLength) {
    // 多余的依赖需要清除
    for(let i = effect._depsLength; i < effect.deps.length ; i++) {
      cleanupEffectDep(effect.deps[i], effect)
    }
    effect.deps.length = effect._depsLength
  }
}

// 创建副作用函数
// trigger触发时，我们可以自己决定副作用函数执行的时机、次数、及执行方式
export function effect(fn: any, options?: any) {
  // 创建 ReactiveEffect 实例
  const _effect = new ReactiveEffect(fn, () => {
    // 执行调度函数
    _effect.run()
  })
  // 初始时执行一次effect函数
  if(options) {
    // 将用户传入的选项合并到 effect 实例上
    Object.assign(_effect, options)
  }
  const runner: (() => any) & { effect?: ReactiveEffect } = _effect.run.bind(_effect) as any
  runner.effect = _effect
  return runner // 返回一个 runner 函数，用于手动触发副作用函数
}

// 将副作用函数和属性进行关联
export function trackEffect(effect: ReactiveEffect, dep: Map<ReactiveEffect, number>) {
  if(dep.get(effect) !== effect._trackId) {
    // effect 没有被追踪过
    // dep记住effect
    dep.set(effect, effect._trackId)
    // 获取上次的依赖，对比是否有变化
    const oldDep = effect.deps[effect._depsLength]
    if(oldDep !== dep) {
      if(oldDep) {
        // 从旧的依赖中删除 effect
        cleanupEffectDep(oldDep, effect)
      }
      // effect记住dep
      effect.deps[effect._depsLength++] = dep
    } else{
      effect._depsLength++
    }
  }
}

// 清除副作用函数依赖
function cleanupEffectDep(dep: Map<ReactiveEffect, number>, effect: ReactiveEffect) {
  dep.delete(effect)
  // 如果没有副作用函数
  if (dep.size === 0) {
    dep.clear()
  }
}

// 触发器
export function triggerEffects(dep: Map<ReactiveEffect, number>) {
  for(const effect of dep.keys()) {
    // 计算属性，则将dirty变为true在
		if (effect._dirtyLevel < DirtyLevels.Dirty) {
			effect._dirtyLevel = DirtyLevels.Dirty;
			// 需要差异化开，计算属性只需要修改dirty
			effect.trigger();
		}
		if (!effect._runnings) {
			// 如果正在运行什么都不做
			if (effect.scheduler) {
				effect.scheduler();
			}
		}
  }
}