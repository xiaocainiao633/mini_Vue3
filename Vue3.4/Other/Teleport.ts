// 该组件可以将内容渲染到特定位置 | 节点 | DOM元素

// 在core_diff文件中进行下述修改即可 

// Teleport组件挂载

// const shapeFlag = isString(type)
// 	? ShapeFlags.ELEMENT
// 	: isTeleport(type) // 如果是穿梭框
// 	? ShapeFlags.TELEPORT
// 	: isObject(type)
// 	? ShapeFlags.STATEFUL_COMPONENT
// 	: isFunction(type)
// 	? ShapeFlags.FUNCTIONAL_COMPONENT
// 	: 0; // 函数式组件
// 创建节点时标识组件类型

// if (shapeFlag & ShapeFlags.TELEPORT) {
// 	type.process(n1, n2, container, anchor, {
// 		mountChildren, // 挂载孩子
// 		patchChildren, // 更新孩子
// 		move(vnode, container, anchor) {
// 			// 移动元素
// 			hostInsert(
// 				vnode.component ? vnode.component.subTree.el : vnode.el,
// 				container,
// 				anchor
// 			);
// 		}
// 	});
// }

import { ShapeFlags } from '../render-runtime/core-diff'

export const TeleportImpl = {
  // 标记是否需要teleport
	__isTeleport: true,
  // 1. 移除 Teleport 组件时的处理逻辑
	remove(vnode: any, unmount: any) {
		const { shapeFlag, children } = vnode;
		if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
			for (let i = 0; i < children.length; i++) {
				const child = children[i];
				unmount(child);
			}
		}
	},
  // 2. 挂载或更新 Teleport 组件的处理逻辑
	process(n1: any, n2: any, container: any, anchor: any, internals: any) {
    // 从内部工具中获取子节点处理方法
		let { mountChildren, patchChildren, move } = internals;
		if (!n1) {
			// 首次挂载
      // 1. 获取目标容器（通过 props.to 指定，如 '#modal-container' 或 'body'）
			const target = (n2.target = document.querySelector(n2.props.to));
			if (target) {
        // 2. 将子节点挂载到目标容器中（而非当前组件的 container）
				mountChildren(n2.children, target, anchor);
			}
		} else {
      // 更新阶段（有旧虚拟节点 n1）
			patchChildren(n1, n2, container); // 1. 对比并更新子节点（和普通组件一样，处理子节点的增删改）
      // 2. 若目标容器变化（props.to 不同），移动子节点到新目标
			if (n2.props.to !== n1.props.to) {
				// 更新并且移动位置
				// 获取下一个元素
				const nextTarget = document.querySelector(n2.props.to);
				n2.children.forEach((child: any) => move(child, nextTarget, anchor));
			}
		}
	}
};

export const isTeleport = (type: any) => type.__isTeleport;

// Teleport组件卸载：
// const unmount = (vnode) => {
// 	const { shapeFlag } = vnode;
// 	if (vnode.type === Fragment) {
// 		unmountChildren(vnode.children);
// 	} else if (shapeFlag & ShapeFlags.COMPONENT) {
// 		unmount(vnode.component.subTree);
// 	} else if (shapeFlag & ShapeFlags.TELEPORT) {
// 		vnode.type.remove(vnode, unmount);
// 	} else {
// 		hostRemove(vnode.el);
// 	}
// };
