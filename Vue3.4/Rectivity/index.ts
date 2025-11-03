// 防止重复代理
export enum ReactiveFlags {
  IS_REACTIVE = '__v_isReactive'
}

export enum DirtyLevels {
  NotDirty = 0,
  Dirty = 4
}