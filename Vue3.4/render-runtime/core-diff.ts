import { isObject } from '../Rectivity/reactivity'

export const isSameVNodeType = (n1: any, n2: any) => {
  return n1.type === n2.type && n1.key === n2.key
}

export const enum ShapeFlags { // vue3提供的形状标识
	ELEMENT = 1,
	FUNCTIONAL_COMPONENT = 1 << 1,
	STATEFUL_COMPONENT = 1 << 2,
	TEXT_CHILDREN = 1 << 3,
	ARRAY_CHILDREN = 1 << 4,
	SLOTS_CHILDREN = 1 << 5,
	TELEPORT = 1 << 6,
	SUSPENSE = 1 << 7,
	COMPONENT_SHOULD_KEEP_ALIVE = 1 << 8,
	COMPONENT_KEPT_ALIVE = 1 << 9,
	COMPONENT = ShapeFlags.STATEFUL_COMPONENT | ShapeFlags.FUNCTIONAL_COMPONENT
}

// createVNode
export function isVNode(value: any) {
  return value ? value.__v_isVNode === true : false
}

function isString(type: any) {
  return type === 'string' ? true : false
}

// type:节点类型,props:属性,children:子节点
export const createVNode = (type: any, props: any, children: any) => {
  // 判断类型,如果是原生类型则为1,如果是组件等类型即为0
	const shapeFlag = isString(type) ? ShapeFlags.ELEMENT : 0;
	const vnode = {
    // 标记为VNode对象
		__v_isVNode: true,
    // 节点类型
		type,
    // 节点属性
		props,
    // 节点的key
		key: props && props['key'],
    // 将来会指向VNode对应的真实DOM元素
		el: null,
    // 子节点
		children,
		shapeFlag
	};

	if (children) {
		let type = 0;
		if (Array.isArray(children)) {
			type = ShapeFlags.ARRAY_CHILDREN;
		} else {
			children = String(children);
			type = ShapeFlags.TEXT_CHILDREN;
		}
		vnode.shapeFlag |= type;
		// 如果shapeFlag为9 说明元素中包含一个文本
		// 如果shapeFlag为17 说明元素中有多个子节点
	}
	return vnode;
};

// h函数
export function h(type: any, propsOrChildren?: any, children?: any) {
	const l = arguments.length;
	if (l === 2) {
		// 只有属性，或者一个元素儿子的时候
		if (isObject(propsOrChildren) && !Array.isArray(propsOrChildren)) {
			if (isVNode(propsOrChildren)) {
        // 说明是个子节点
				// h('div',h('span'))
				return createVNode(type, null, [propsOrChildren]);
			}
			return createVNode(type, propsOrChildren, null); // h('div',{style:{color:'red'}});
		} else {
			// 传递儿子列表的情况
      // 第二个参数不是对象（可能是数组、文本等），说明是子节点（如 h('div', [h('span')]) 或 h('div', '文本')）
			return createVNode(type, null, propsOrChildren); // h('div',null,[h('span'),h('span')])
		}
	} else {
		if (l > 3) {
			// 超过3个除了前两个都是儿子
			children = Array.prototype.slice.call(arguments, 2);
		} else if (l === 3 && isVNode(children)) {
			children = [children]; // 儿子是元素将其包装成 h('div',null,[h('span')])
		}
		return createVNode(type, propsOrChildren, children); // h('div',null,'erxiao')
	}
}
// 注意子节点是：数组、文本、null

// 渲染器工厂函数
export function createRenderer(options: any) {
  // 是对平台原生操作的封装在浏览器中，hostCreateElement 可能对应 document.createElement
  const {
		insert: hostInsert,        // 插入节点到父容器
    remove: hostRemove,        // 从父容器移除节点
    patchProp: hostPatchProp,  // 更新节点的属性（如 class、style、事件等）
    createElement: hostCreateElement, // 创建元素节点（如 DOM 中的 document.createElement）
    createText: hostCreateText,       // 创建文本节点（如 document.createTextNode）
    setText: hostSetText,             // 设置文本节点的内容
    setElementText: hostSetElementText, // 设置元素节点的文本内容（如 el.textContent）
    parentNode: hostParentNode,       // 获取节点的父节点
    nextSibling: hostNextSibling      // 获取节点的下一个兄弟节点
	} = options;

  // 挂载子节点数组
  const mountChildren = (children: any, container: any) => {
    for(let i = 0 ; i < children.length ; i++) {
      // 如果子节点是 [h('span'), '文本']，mountChildren 会依次渲染 span 元素和文本节点，插入到父容器中
      // null表示是初次渲染
      patch(null, children[i], container)
    }
  }

  const mountElement = (vnode: any, container: any) => {
    const { type, props, shapeFlag } = vnode
    // 创建真实DOM元素,并挂载到vode.el上
    let el = (vnode.el = hostCreateElement(type))

    // 处理元素属性
    if(props) {
      for(const key in props) {
        // 调用平台方法更新属性
        hostPatchProp(el, key, null, props[key])
      }
    }

    // 处理子节点,根据shapeFlag判断子节点类型
    if(shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      // 如果是文本子节点（shapeFlag 包含 TEXT_CHILDREN 标记）
      hostSetElementText(el, vnode.children); // 直接设置元素的文本内容
    } else if(shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      mountChildren(vnode.children, el); // 调用 mountChildren 递归挂载子节点
    }

    hostInsert(el, container)
  }

  // patch是核心函数,负责节点的初始化渲染和更新
  // 不直接依赖具体平台的 API，而是调用 options 中传入的抽象方法
  const patch = (n1: any, n2: any, container: any) => {
    if(n1 == n2) {
      return 
    }

    if(n1 && !isSameVNodeType(n1, n2)) {
      unmount(n1)
      n1 = null
    }

    if(n1 == null) {
      mountElement(n2, container)
    } else{
      // diff算法
    }
  }

  const unmount = (vnode: any) => {
    hostRemove(vnode.el)
  }

  // 是渲染器的入口方法,负责触发渲染流程
  const render = (vnode: any, container: any) => {
    if(vnode == null) {
      if(container._vnode){
        // 执行卸载逻辑
        unmount(container._vnode)
      }
    } else{
      patch(container._vnode || null, vnode, container)
    }
    // 用于缓存当前容器中渲染的虚拟节点，作为下次更新时的 n1（旧节点），供 diff 算法使用
    container._vnode = vnode
  }
  return {
    render
  }
}

export const render = (vnode: any, container: any) => {
  let renderoptions
  createRenderer(renderoptions).render(vnode, container)
}
export * from './core-diff'

// 假设有这样一个节点
// const vnode = h('div', { class: 'box' }, [
//   h('span', null, 'hello'),
//   'world'
// ]);

// 渲染流程如下：
// 1.调用 patch(null, vnode, document.body)（n1 为 null，触发初次渲染）。
// 2.patch 调用 mountElement(vnode, document.body)。
// 3.mountElement 执行：
// 用 hostCreateElement('div') 创建真实 div 元素，存储到 vnode.el。
// 遍历 props（{ class: 'box' }），通过 hostPatchProp 给 div 设置 class="box"。
// 检查 shapeFlag（ARRAY_CHILDREN，因为子节点是数组），调用 mountChildren。
// mountChildren 遍历子节点 [spanVNode, 'world']：
// 第一个子节点是 span 元素 VNode，调用 patch(null, spanVNode, div) → 递归挂载 span 元素和其文本 “hello”。
// 第二个子节点是文本 “world”，调用 patch(null, 'world', div) → 最终会创建文本节点并插入 div。
// 用 hostInsert 将 div 插入到 document.body 中。
// 4.最终页面上会渲染出：<div class="box"><span>hello</span>world</div>