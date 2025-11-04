// 比对属性
export const patchProp = (el: any , key: any, preValue: any, nextValue: any) => {
  if(key === 'class') {
    patchClass(el, nextValue)
  } else if(key === 'style') {
    patchStyle(el, preValue, nextValue)
  } else if(/^on[^a-z]/.test(key)) {
    patchEvent(el, key, nextValue)
  } else{
    patchAttr(el, key, nextValue)
  }
}

// 操作类名
function patchClass(el: any, value: any) {
  if(value == null) {
    el.removeAttribute('class')
  } else{
    el.className = value
  }
}

// 操作样式
function patchStyle(el:any, prev:any, next: any) {
  const style = el.style
  for(const key in next) {
    // 用新的直接覆盖
    style[key] = next[key]
  }
  if(prev) {
    for(const key in prev) {
      if(next[key] == null) {
        style[key] = null
      }
    }
  }
}

function createInvoker(initialValue: any) {
  // 创建一个包装函数 invoker，调用时会执行 invoker.value（即事件处理函数），并传入事件对象 e
  const invoker = (e:any) => invoker.value(e)
  invoker.value = initialValue
  return invoker
}

function patchEvent(el:any, rawName: any, nextValue:any) {
  // 更新事件
  // 获取元素上存储事件执行器的对象 invokers（若不存在则初始化一个空对象，挂载到 el._vei 上)
  const invokers = el._vei || (el._vei = {})
  const existingInvoker = invokers[rawName]

  if(nextValue && existingInvoker){
    existingInvoker.value = nextValue
  } else{
    // 处理原始事件名：去掉前缀 on 并转为小写（如onClick → click，匹配 DOM 事件名规范）
    const name = rawName.slice(2).toLowerCase()
    if(nextValue) {
      const invoker = (invokers[rawName] = createInvoker(nextValue))
      el.addEventListener(name, invoker)
    } else if(existingInvoker) {
      el.removeEventListener(name, existingInvoker)
      invokers[rawName] = undefined
    }
  }
}

// 操作属性
function patchAttr(el: any, key: any, value: any){
  if(value == null) {
    el.removeAttribute(key)
  } else{
    el.setAttribute(key, value)
  }
}