// 组件的渲染更新逻辑
import {
  isSameVNodeType,
  createRenderer,
  ShapeFlags,
} from '../render-runtime/core-diff'
import { reactive } from '../Rectivity/reactivity'
import { ReactiveEffect } from '../Rectivity/effect'
import {  hasOwn } from './index'

let options:any
const render = createRenderer(options)

const patch = (n1: any, n2: any, container: any, anchor?: any) => {
	// 初始化和diff算法都在这里喲
	if (n1 == n2) {
		return;
	}
	if (n1 && !isSameVNodeType(n1, n2)) {
		// 有n1 是n1和n2不是同一个节点
		render.unmount(n1);
		n1 = null;
	}
	const { type, shapeFlag } = n2;
	switch (type) {
		// ...
		default:
			if (shapeFlag & ShapeFlags.ELEMENT) {
				render.processElement(n1, n2, container, anchor);
			} else if (shapeFlag & ShapeFlags.COMPONENT) {
				processComponent(n1, n2, container, anchor);
			}  
	}
};

// 映射到组件实例的attrs属性
const publicPropertiesMap:any = {
  $attrs: (i: any) => i.attrs
}

const mountComponent = (vnode: any, container: any, anchor: any) => {
  let { data = () => ({}), render, porops: propsOptions = {}} = vnode.type
  const state = reactive(data())

  const instance: {
    state: any,
    data: any,
    isMounted: boolean,
    subTree: any,
    update: (() => any) | null,
    vnode: any,
    propsOptions:any,
    attrs: object,
    props: any
    proxy: any | null
  } = {
    state,
    data,
    isMounted: false,
    subTree: null,
    update: null,
    vnode,
    propsOptions,
    attrs: {},
    props: {},
    proxy: null
  }

  vnode.component = instance
  initProps(instance, vnode.props)
  // 组件实例的代理对象
  instance.proxy = new Proxy(instance, {
    get(target, key) {
			const { data, props } = target;
			if (data && hasOwn(data, key)) {
				return data[key];
			} else if (hasOwn(props, key)) {
				return props[key];
			}
			const publicGetter = publicPropertiesMap[key];
			if (publicGetter) {
				return publicGetter(target);
			}
		},
		set(target, key, value) {
			const { data, props } = target;
			if (data && hasOwn(data, key)) {
				data[key] = value;
				return true;
        // 不能修改props属性
			} else if (hasOwn(props, key)) {
				console.warn(`Attempting to mutate prop "${String(key)}". Props are readonly.`);
				return false; 
			}
			return true;
		}
  })

  const componentUpdateFn = () => {
    // 挂载阶段
    if (!instance.isMounted) {
      const subTree = render.call(state, state)
      patch(null, subTree, container, anchor)
      instance.subTree = subTree
      instance.isMounted = true
    } else {
      // 更新阶段
      const subTree = render.call(state, state)
      patch(instance.subTree, subTree, container, anchor)
      instance.subTree = subTree
    }
    // 创建响应式副作用
    const effect = new ReactiveEffect(componentUpdateFn, () => queueJob(update))
    const update = (instance.update = () => effect.run())
    update()
  }
}

// 组件的入口调度逻辑
const processComponent = (n1: any, n2: any, container: any, anchor: any) => {
  if(n1 == null) {
    mountComponent(n2, container, anchor)
  } else{
    // 组件化更新逻辑
  }
}

// 组件异步渲染,使用任务队列处理
// 避免统一论中重复执行相同任务
const queue: Array<any> = [] // 存储待执行的任务
let isFlushing = false // 标记队列是否正在执行
const resolvedPromise = Promise.resolve() // 触发异步执行
export function queueJob(job: any) {
  // 避免重复添加相同任务
  if(!queue.includes(job)) {
    queue.push(job)
  }
  // 若队列未在执行，则调度执行
  if( !isFlushing ) {
    isFlushing = true
    resolvedPromise.then(() => {
      // 执行前重置标记
      isFlushing = false
      // 复制队列并清空原队列
      let copy = queue.slice(0)
      queue.length = 0
      // 执行所有任务
      for(let i = 0 ; i < copy.length ; i++) {
        let job = copy[i]
        job()
      }
      // 释放内存
      copy.length = 0
    })
  }
}

// 假设组件的 update 函数是 job
// const updateJob = () => {
//   console.log('执行组件更新');
// 实际会调用 patch 对比 VNode 并更新 DOM
// };

// 连续修改数据，触发三次 updateJob
// state.count = 1;  触发 queueJob(updateJob) → 队列 [updateJob]
// state.count = 2;  触发 queueJob(updateJob) → 队列已存在，不重复添加
// state.count = 3;  触发 queueJob(updateJob) → 队列已存在，不重复添加

// 当前同步代码执行完毕后，微任务触发：
// 执行 updateJob 一次（而非三次），最终 DOM 只更新一次


// 组件props和attrs实现
// Props和Attrs关系是：没有定义在component.props中的属性将存储到attrs对象中

export function initProps(instance: any, rawProps: any) {
  const props: any = {}
  const attrs: any = {}
  const options = instance.propsOptions || {}
  if(rawProps) {
    for(let key in rawProps) {
      const value = rawProps[key]
      // 若属性在父组件声明的props中，存入props
      if(key in options) {
        props[key] = value
      } else{
        // 否则存入attrs中
        attrs[key] = value
      }
    }
  }
  instance.props = reactive(props)
  instance.attrs = attrs
}

