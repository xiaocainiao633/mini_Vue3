// 基本使用:
// const My1 = {
// 	name: 'My1',
// 	setup() {
// 		onMounted(() => {
// 			console.log('my1 mounted');
// 		});
// 		return () => h('h1', 'my1');
// 	}
// };
// // 2.组件
// const My2 = {
// 	name: 'My2',
// 	setup() {
// 		onMounted(() => {
// 			console.log('my2 mounted');
// 		});
// 		return () => h('h1', 'my2');
// 	}
// };
// // keepAlive会对渲染的组件进行缓存
// render(
// 	h(KeepAlive, null, {
// 		default: () => h(My1) // 缓存1
// 	}),
// 	app
// );
// setTimeout(() => {
// 	render(
// 		h(KeepAlive, null, {
// 			default: () => h(My2) // 缓存2
// 		}),
// 		app
// 	);
// }, 1000);
// setTimeout(() => {
// 	render(
// 		h(KeepAlive, null, {
// 			default: () => h(My1) // 复用1
// 		}),
// 		app
// 	);
// }, 2000);


import { ShapeFlags } from '../render-runtime/core-diff'
// 创建上下文对象,存储渲染时所需的属性
const instance = {
  // 组件实例
  ctx: {}, // instance上下文
}

function isVnode(vnode: any) {
  return vnode ? true : false
}

export const KeepAliveImpl = {
  __isKeepAlive: true,
  setup(props: any, { slots }: any) {
    const keys = new Set(); // 存储所有缓存的key（用于管理缓存数量，如限制最大缓存数）
    const cache = new Map(); // 核心缓存容器：key → 子组件的虚拟节点（subTree）
    // const instance = getCurrentInstance() // 获取组件实例
    let pendingCacheKey = null // 临时存储需要缓存的key
    // onMounted(() => {
    //   cache.set(pendingCacheKey, instance.subTree);
    // });
    return () => {
      let vnode = slots.default()
      if (
        !isVnode(vnode) ||
        !(vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT)
      ) {
        return vnode; // 不缓存，直接返回
        }
      const comp = vnode.type; // 子组件的类型（如 MyComponent）
      // 生成缓存key：优先使用vnode.key，若无则用组件类型作为key
      const key = vnode.key == null ? comp : vnode.key;
      const cacheVNode = cache.get(key); // 查看是否已有缓存
      pendingCacheKey = key; // 记录当前要缓存的key（等待onMounted触发时存入cache）

      if (cacheVNode) {
        // 若已有缓存：此处省略复用逻辑（通常会直接返回缓存的vnode，避免重新渲染）
      } else {
        keys.add(key); // 若无缓存：将key加入keys集合，标记为需要缓存
      }

      // 标记子组件需要被KeepAlive缓存（供后续渲染流程识别）
      vnode.shapeFlag |= ShapeFlags.COMPONENT_SHOULD_KEEP_ALIVE;
      return vnode;
    }
  } 
}

// 复用组件
// export const KeepAliveImpl = {
// 	__isKeepAlive: true,
// 	setup(props, { slots }) {
// 		// ...
// 		let { createElement, move, unmount: _unmount } = instance.ctx.renderer;
// 		const storageContainer = createElement('div'); // 缓存盒子
// 		instance.ctx.activate = (vnode, container, anchor) => {
// 			// 激活则移动到容器中
// 			move(vnode, container, anchor);
// 		};
// 		instance.ctx.deactivate = (vnode) => {
// 			// 卸载则移动到缓存盒子中
// 			move(vnode, storageContainer, null);
// 		};
// 		return () => {
// 			// ...
// 			if (cacheVNode) {
// 				// 缓存中有
// 				vnode.component = cacheVNode.component; // 复用组件，并且标识不需要真正的创建
// 				vnode.shapeFlag |= ShapeFlags.COMPONENT_KEPT_ALIVE;
// 				// make this key the freshest
// 				keys.delete(key);
// 				keys.add(key);
// 			}
// 		};
// 	}
// };


export const isKeepAlive = (vnode: any) => {
  vnode.type.__isKeepAlive
}

const updateComponentPreRender = (instance: any, next: any) => {
	instance.next = null;
	instance.vnode = next;
	// updataProps(instance, instance.props, next.props || {});

	Object.assign(instance.slots, next.children); // 渲染的时候需要更新插槽
};

// const mountComponent = (vnode, container, anchor, parentComponent) => {
// 	// 1) 要创造一个组件的实例
// 	let instance = (vnode.component = createComponentInstance(
// 		vnode,
// 		parentComponent
// 	));
// 	if (isKeepAlive(vnode)) {
// 		(instance.ctx as any).renderer = {
// 			patch,
// 			createElement: hostCreateElement,
// 			move(vnode, container) {
// 				hostInsert(vnode.component.subTree.el, container);
// 			},
// 			unmount
// 		};
// 	}
// };


// 缓存组件
// 在渲染完毕后需要对`subTree`进行缓存，需要保证渲染完毕后在调用`mounted`事件

// 卸载组件
const unmount = (vnode: any, parentComponent: any) => {
	const { shapeFlag } = vnode;
	if (shapeFlag & ShapeFlags.COMPONENT_SHOULD_KEEP_ALIVE) {
		parentComponent.ctx.deactivate(vnode);
		return;
	}
};

// 挂载组件
// const processComponent = (n1, n2, container, anchor, parentComponent) => {
// 	// 统一处理组件， 里面在区分是普通的还是 函数式组件
// 	if (n1 == null) {
// 		if (n2.shapeFlag & ShapeFlags.COMPONENT_KEPT_ALIVE) {
// 			parentComponent.ctx.activate(n2, container, anchor);
// 		} else {
// 			mountComponent(n2, container, anchor, parentComponent);
// 		}
// 	} else {
// 		// 组件更新靠的是props
// 		updateComponent(n1, n2);
// 	}
// };


// const cacheSubtree = () => {
// 	cache.set(pendingCacheKey, instance.subTree);
// };
// onMounted(cacheSubtree);
// onUpdated(cacheSubtree); // 在更新时进行重新缓存

// if (cacheVNode) {
// 	// 缓存中有
// 	vnode.component = cacheVNode.component; // 复用组件，并且标识不需要真正的创建
// 	vnode.shapeFlag |= ShapeFlags.COMPONENT_KEPT_ALIVE;
// } else {
// 	keys.add(key);
// 	if (max && keys.size > max) {
// 		// 超过限制删除第一个
// 		pruneCacheEntry(keys.values().next().value);
// 	}
// }
// vnode.shapeFlag |= ShapeFlags.COMPONENT_SHOULD_KEEP_ALIVE;

// function resetShapeFlag(vnode) {
// 	let shapeFlag = vnode.shapeFlag;
// 	if (shapeFlag & ShapeFlags.COMPONENT_SHOULD_KEEP_ALIVE) {
// 		shapeFlag -= ShapeFlags.COMPONENT_SHOULD_KEEP_ALIVE;
// 	}
// 	if (shapeFlag & ShapeFlags.COMPONENT_KEPT_ALIVE) {
// 		shapeFlag -= ShapeFlags.COMPONENT_KEPT_ALIVE;
// 	}
// 	vnode.shapeFlag = shapeFlag;
// }

