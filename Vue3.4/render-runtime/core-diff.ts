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
	const shapeFlag = isString(type) 
  ? ShapeFlags.ELEMENT
  : isObject(type)
  ? ShapeFlags.STATEFUL_COMPONENT 
  : 0;
  
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
  const patch = (n1: any, n2: any, container: any, anchor?: any) => {
    if(n1 == n2) {
      return 
    }

    if(n1 && !isSameVNodeType(n1, n2)) {
      unmount(n1)
      n1 = null
    }

    processElement(n1, n2, container)
  }

  // diff算法

  const patchProps = (oldProps: any, newProps: any, el: any) => {
    for(let key in newProps) {
      // 用新的生成
      hostPatchProp(el, key, oldProps[key], newProps[key])
    }
    // 老的里面有新的,没有就删除
    for(let key in oldProps) {
      if(!(key in newProps)) {
        hostPatchProp(el, key, oldProps[key], null)
      }
    }
  }

  const patchElement = (n1: any, n2: any) => {
    let el = (n2.el = n1.el)
    const oldProps = n1.props || {};
	  const newProps = n2.props || {};
	  patchProps(oldProps, newProps, el); // 比对新老属性
	  patchChildren(n1, n2, el); // 比较元素的孩子节点
  }

  // 递归卸载一组子节点对应的真实DOM
  const unmountChildren = (children: any) => {
    for (let i = 0; i < children.length; i++) {
      unmount(children[i]);
    }
  };

  const patchChildren = (n1: any, n2: any, el: any) => {
    const c1 = n1 && n1.children;
    const c2 = n2.children;
    const prevShapeFlag = n1.shapeFlag;
    const shapeFlag = n2.shapeFlag;
    
    // 表示子节点是文本
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      // 1. 若旧节点的子节点是数组（之前是多个元素），先卸载所有旧子节点
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        unmountChildren(c1);
      }
      // 2. 若新旧文本内容不同，直接更新真实 DOM 的文本内容
      if (c1 !== c2) {
        hostSetElementText(el, c2);
      }
    } else {
      // 子情况 A：旧节点的子节点是数组（之前有多个元素）
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        // A1. 新节点的子节点也是数组：需要执行更复杂的 diff 算法（代码中省略，实际会对比数组中子节点的增删改移）
        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        } else {
        // A2. 新节点的子节点不是数组（可能是空）：直接卸载所有旧子节点
          unmountChildren(c1);
        }
      } else {
        // 子情况 B：旧节点的子节点不是数组（可能是文本或空）
        // B1. 旧节点的子节点是文本：先清空真实 DOM 的文本内容
        if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
          hostSetElementText(el, '');
        }
        // B2. 新节点的子节点是数组：挂载新的子节点数组（创建并插入真实 DOM）
        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          mountChildren(c2, el);
        }
      }
    }
  };
  const patchKeydChildren = (c1: any, c2: any, container: any) => {
    let i = 0;
    const l2 = c2.length;
    let e1 = c1.length - 1;
    let e2 = l2 - 1;
     // 1. sync from start
     // (a b) c
    // (a b) d e
    while (i <= e1 && i <= e2) {
      const n1 = c1[i];
      const n2 = c2[i];
      if (isSameVNodeType(n1, n2)) {
        patch(n1, n2, container);
      } else {
        break;
      }
      i++;
     }
    while (i <= e1 && i <= e2) {
      const n1 = c1[e1];
      const n2 = c2[e2];
      if (isSameVNodeType(n1, n2)) {
        patch(n1, n2, container);
      } else {
        break;
      }
      e1--;
      e2--;
    }

    // 3. common sequence + mount
    // (a b)
    // (a b) c
    // i = 2, e1 = 1, e2 = 2
    // (a b)
    // c (a b)
    // i = 0, e1 = -1, e2 = 0
    if (i > e1) {
      // 说明有新增
      if (i <= e2) {
        // 表示有新增的部分
        // 先根据e2 取他的下一个元素  和 数组长度进行比较
        const nextPos = e2 + 1;
        const anchor = nextPos < c2.length ? c2[nextPos].el : null;
        while (i <= e2) {
          patch(null, c2[i], container, anchor);
          i++;
        }
      }
    }

    // 4. common sequence + unmount
    // (a b) c
    // (a b)
    // i = 2, e1 = 2, e2 = 1
    // a (b c)
    // (b c)
    // i = 0, e1 = 0, e2 = -1
    else if (i > e2) {
      while (i <= e1) {
        unmount(c1[i])
        i++
      }
    }
    // 5. unknown sequence
    // a b [c d e] f g
    // a b [e c d h] f g
    // i = 2, e1 = 4, e2 = 5
    else {
      const s1 = i;
      const s2 = i;
      const keyToNewIndexMap = new Map();
      for (let i = s2; i <= e2; i++) {
        const nextChild = c2[i];
        keyToNewIndexMap.set(nextChild.key, i);
      }
      // 标记新元素的，对应老元素的索引位置
      const toBePatched = e2 - s2 + 1;
      const newIndexToOldMapIndex = new Array(toBePatched).fill(0); //
      for (let i = s1; i <= e1; i++) {
        const prevChild = c1[i];
        let newIndex = keyToNewIndexMap.get(prevChild.key); // 获取新的索引
        if (newIndex == undefined) {
          unmount(prevChild); // 老的有 新的没有直接删除
        } else {
          newIndexToOldMapIndex[newIndex - s2] = i + 1;
          patch(prevChild, c2[newIndex], container);
        }
      }
      let increasingNewIndexSequence = getSequence(newIndexToOldMapIndex);
      let j = increasingNewIndexSequence.length - 1; // 取出最后一个人的索引
      for (let i = toBePatched - 1; i >= 0; i--) {
        let currentIndex = i + s2; // 找到h的索引
        let child = c2[currentIndex]; // 找到h对应的节点
        let anchor = currentIndex + 1 < c2.length ? c2[currentIndex + 1].el : null; // 第一次插入h 后 h是一个虚拟节点，同时插入后 虚拟节点会
        if (newIndexToOldMapIndex[i] == 0) {
          // 如果自己是0说明没有被patch过
          patch(null, child, container, anchor);
        } else {
          if (i != increasingNewIndexSequence[j]) {
            hostInsert(child.el, container, anchor); // 操作当前的d 以d下一个作为参照物插入
          } else {
            j--; // 跳过不需要移动的元素， 为了减少移动操作 需要这个最长递增子序列算法
          }
        }
      }
    }
  };

  // 二分算法
  function getSequence(arr: any) {
    // 最终的结果是索引
    const len = arr.length;
    const result = [0]; // 索引  递增的序列 用二分查找性能高
    const p = arr.slice(0); // 里面内容无所谓 和 原本的数组相同 用来存放索引
    let start;
    let end;
    let middle;
    for (let i = 0; i < len; i++) {
      // O(n)
      const arrI = arr[i];
      if (arrI !== 0) {
        let resultLastIndex = result[result.length - 1];
        // 取到索引对应的值
        if (arr[resultLastIndex] < arrI) {
          p[i] = resultLastIndex; // 标记当前前一个对应的索引
          result.push(i);
          // 当前的值 比上一个人大 ，直接push ，并且让这个人得记录他的前一个
          continue;
        }
        // 二分查找 找到比当前值大的那一个
        start = 0;
        end = result.length - 1;
        while (start < end) {
          // 重合就说明找到了 对应的值  // O(logn)
          middle = ((start + end) / 2) | 0; // 找到中间位置的前一个
          if (arr[result[middle]] < arrI) {
            start = middle + 1;
          } else {
            end = middle;
          } // 找到结果集中，比当前这一项大的数
        }
        // start / end 就是找到的位置
        if (arrI < arr[result[start]]) {
          // 如果相同 或者 比当前的还大就不换了
          if (start > 0) {
            // 才需要替换
            p[i] = result[start - 1]; // 要将他替换的前一个记住
          }
          result[start] = i;
        }
      }
    }
    let i = result.length; // 总长度
    let last = result[i - 1]; // 找到了最后一项
    while (i-- > 0) {
      // 根据前驱节点一个个向前查找
      result[i] = last; // 最后一项肯定是正确的
      last = p[last];
    }
    return result;
  }

  const processElement = (n1: any, n2: any, container: any, anchor?: any) => {
    if(n1 == null) {
      mountElement(n2,container)
    } else {
      patchElement(n1, n2)
    }
  }

  const unmount = (vnode: any) => {
    if(vnode.type === 'Fragment') {
      return unmountChildren(vnode.children)
    }
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
    render,
    unmount,
    processElement,
    options,
    mountChildren,
    patchChildren
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
