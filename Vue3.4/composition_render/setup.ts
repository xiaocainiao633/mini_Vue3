import { initProps } from './composition'
import { isFunction } from '../Rectivity/computed'
import { isObject, reactive } from '../Rectivity/reactivity'
import { proxyRefs } from '../Rectivity/ref'
import { hasOwn, updateProps } from './index'
import { ShapeFlags } from '../render-runtime/core-diff'

// 组件化初始阶段的核心逻辑，接收组件实例，初始化组建的各种配置
export function setupComponent(instance: any) {
  // 从虚拟节点中获取props和组件类型
  const { props, type, children } = instance.vnode
  initProps(instance, props)
  initSlots(instance, children);
  // 获取setup函数
  let { setup } = type
  if(setup) {
    // 对setup做相应处理 emit
    const setupContext = {
	    attrs: instance.attrs,
	    emit: (event: any, ...args: any) => {
        // 将事件名转换为驼峰式（如 'click' → 'onClick'）
		    const eventName = `on${event[0].toUpperCase() + event.slice(1)}`;
         // 从组件的虚拟节点 props 中找到对应的事件处理函数（父组件绑定的）
		    const handler = instance.vnode.props[eventName]; // 找到绑定的方法
		    // 触发方法执行
		    handler && handler(...args);
	    }
    };

    // setup 的第一个参数是 props（响应式），第二个参数是上下文对象
    const setupResult = setup(instance.props, setupContext)
    console.log(setupResult)
    // 处理setup的返回值
    if(isFunction(setupResult)) {
      // 若返回函数：将其作为组件的 render 函数（替代 type.render）
      instance.render = setupResult
    } else if(isObject(setupResult)) {
      // 若返回对象：将其包装为代理（处理 ref 自动解包），挂载到 instance.setupState
      instance.setupState = proxyRefs(setupResult)
    }
  }

  instance.proxy = new Proxy(instance, PublicInstanceProxyHandlers)
  const data = type.data
  if(data) {
    // 确保每个组件实例都有独立的 data 对象（避免多个实例共享同一数据）
    if(!isFunction(data)) {
      return console.warn("Error!")
    }
    instance.data = reactive(data.call(instance.proxy))
  }
  if(!instance.render) {
    instance.render = type.render
  }
}

// 拦截对象
const PublicInstanceProxyHandlers = {
	get(target: any, key: any) {
		const { data, props, setupState } = target;
    // 优先级 1：先从 data 中找（选项式 API 的状态）
		if (data && hasOwn(data, key)) {
			return data[key];
		} else if (hasOwn(props, key)) {
      // 优先级 2：再从 props 中找（父组件传递的属性）
			return props[key];
		} else if (setupState && hasOwn(setupState, key)) {
			// 优先级 3：再从 setupState 中找（组合式 API 的状态）
			return setupState[key];
		}
     // 优先级 4：最后从公共属性映射表中找（如 $attrs、$emit）
		const publicGetter = publicPropertiesMap[key];
		if (publicGetter) {
			return publicGetter(target);
		}
	},
	set(target: any, key: any, value: any) {
		const { data, props, setupState } = target;
    // 规则 1：若属于 data 中的属性，允许修改（触发响应式更新）
		if (data && hasOwn(data, key)) {
			data[key] = value;
			return true;
		} else if (hasOwn(props, key)) {
      // 规则 2：若属于 props 中的属性，禁止修改（警告并返回 false）
			console.warn(`Attempting to mutate prop "${key}". Props are readonly.`);
			return false;
		} else if (setupState && hasOwn(setupState, key)) {
			// setup返回值做代理
			setupState[key] = value;
		}
		return true;
	}
};

const publicPropertiesMap: any = {
	$attrs: (i: any) => i.attrs,//映射attrs属性
	$slots: (i: any) => i.slots//slots属性
};

// 初始化插槽的内容
function initSlots(instance: any, children: any) {
  // 判断组件的虚拟节点是否包含“插槽类型的子节点”
	if (instance.vnode.shapeFlag & ShapeFlags.SLOTS_CHILDREN) {
    // 若包含，则将 children 直接作为插槽内容挂载到实例
		instance.slots = children;
	} else {
    instance.slots = {};
		instance.slots = {};
	}
}

export function createComponentInstance(vnode: any, parent: any) {
	const instance = {
		// 组件的实例
		slots: null, // 初始化插槽属性
		data: null,
		provides: parent ? parent.provides : Object.create(null) // 创建一个provides对象
	};
	return instance;
}

export function updateComponentPreRender(instance: any, next: any) {
	instance.next = null;
	instance.vnode = next;
	updateProps(instance, instance.props, next.props);
	Object.assign(instance.slots, next.children); // 渲染前要更新插槽
}

