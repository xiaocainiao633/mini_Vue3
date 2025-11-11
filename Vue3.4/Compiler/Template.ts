// 编译优化
// Diff算法无法避免新旧虚拟DOM中无用的比较操作，通过patchFlags来标记动态内容
`<div>
	<h1>Hello</h1>
	<span>{{name}}</span>
</div>`
// 此template经过模板编译后会变成以下代码：
let Vue: any

const {
	createElementVNode: _createElementVNode,
	toDisplayString: _toDisplayString,
	createTextVNode: _createTextVNode,
	openBlock: _openBlock,
	createElementBlock: _createElementBlock
} = Vue;

function render(_ctx: any, _cache: any, $props: any, $setup: any, $data: any, $options: any) {
	return (
		_openBlock(),
		_createElementBlock('div', null, [
			_createElementVNode('h1', null, 'Hello'),
			_createTextVNode(),
			_createElementVNode(
				'span',
				null,
				_toDisplayString(_ctx.name),
				1 /* TEXT */
			)
		])
	);
};

import { reactive } from '../Rectivity/reactivity'
import { toRefs } from '../Rectivity/ref'

const VueComponent = {
	setup() {
		let state = reactive({ name: 'erxiao' });
		setTimeout(() => {
			state.name = 'xx';
		}, 1000);
		return {
			...toRefs(state)
		};
	},
	render(_ctx: any) {
		return (
			_openBlock(),
			_createElementBlock('div', null, [
				_createElementVNode('h1', null, 'Hello'),
				_createElementVNode(
					'span',
					null,
					_toDisplayString(_ctx.name),
					1 /* TEXT */
				)
			])
		);
	}
};

// 生成的虚拟DOM是:
// {
//     type: "div",
//     __v_isVNode: true,
//     children:[
//         {type: 'h1', props: null, key: null, …}
//         {type: Symbol(), props: null, key: null, …}
//         {type: 'span', props: null, key: null, …}
//     ],
//     dynamicChildren:[{type: 'span', children: _ctx.name, patchFlag: 1}]
// }
// 此时生成的虚拟节点多出一个 dynamicChildren 属性。这个就是 block 的作用，block 可以收集所有后代动态节点。这样后续更新时可以直接跳过静态节点，实现靶向更新

import { createVNode } from '../render-runtime/core-diff'
import { isObject } from '../Rectivity/reactivity'

// 动态标识：
export const enum PatchFlags {
	TEXT = 1, // 动态文本节点
	CLASS = 1 << 1, // 动态class
	STYLE = 1 << 2, // 动态style
	PROPS = 1 << 3, // 除了class\style动态属性
	FULL_PROPS = 1 << 4, // 有key，需要完整diff
	HYDRATE_EVENTS = 1 << 5, // 挂载过事件的
	STABLE_FRAGMENT = 1 << 6, // 稳定序列，子节点顺序不会发生变化
	KEYED_FRAGMENT = 1 << 7, // 子节点有key的fragment
	UNKEYED_FRAGMENT = 1 << 8, // 子节点没有key的fragment
	NEED_PATCH = 1 << 9, // 进行非props比较, ref比较
	DYNAMIC_SLOTS = 1 << 10, // 动态插槽
	DEV_ROOT_FRAGMENT = 1 << 11,
	HOISTED = -1, // 表示静态节点，内容变化，不比较儿子
	BAIL = -2 // 表示diff算法应该结束
}

// 靶向更新实现：
let createVnode // 实际是之前写好的
export { createVnode as createElementVNode }
let currentBlock: any = null

export function openBlock() {
  // 创建block
  currentBlock = []
}

export function closeBlock() {
  currentBlock = null  
}

export function createElementBlock(type: any, props?: any, children?: any, patchFlag?: any) {
  // 创建block元素
  return setupBlock(createVNode(type, props, children))// 将动态元素挂载到block节点上
}

export function setupBlock(vnode: any) {
  vnode.dynamicChildren = currentBlock
  closeBlock()
  return vnode
}

export function createTextVNode(text: '', flag = 0) {
  return createVNode(Text, null, text)
}

function isString(val: any) {
  return typeof (val === 'string' && val !== null) ? true : false
}

export function toDisplayString(val: any) {
  return isString(val)
  ? val
  : val == null
  ? ''
  : isObject(val)
  ? JSON.stringify(val)
  : String(val)
}

// export const createVNode = (type, props, children = null, patchFlag = 0) => {
// 	// ...
// 	if (currentBlock && vnode.patchFlag > 0) {
// 		currentBlock.push(vnode);
// 	}
// 	return vnode;
// };

// 靶向更新
// const patchElement = (n1, n2, container, parentComponent) => {
// 	// 1.比较元素的差异，肯定需要复用dom元素
// 	// 2.比较属性和元素的子节点
// 	let el = (n2.el = n1.el);

// 	let oldProps = n1.props || {};
// 	let newProps = n2.props || {};

// 	let { patchFlag } = n2;
// 	if (patchFlag) {
// 1. 若标记包含“类名更新”（CLASS），只更新 class 属性
// 		if (patchFlag & PatchFlags.CLASS) {
// 			if (oldProps.class !== newProps.class) {
// 				hostPatchProp(el, 'class', null, newProps.class);
// 			}
// 		}
// 2. 若标记包含“文本更新”（TEXT），只更新文本内容
// 		if (patchFlag & PatchFlags.TEXT) {
// 			if (n1.children !== n2.children) {
// 				hostSetElementText(el, n2.children);
// 			}
// 		}
// 	} else {
// 		// 处理所有属性
// 		patchProps(oldProps, newProps, el);
// 	}
// 	if (n2.dynamicChildren) {
// 		// 比较动态节点
// 		patchBlockChildren(n1, n2, container, parentComponent);
// 	} else {
// 		patchChildren(n1, n2, el, parentComponent);
// 	}
// };

function patchElement(n1 : any, n2 : any, container: any, component: any) {
  return 
}

function patchBlockChildren(n1: any, n2: any, container: any, parentComponent: any) {
  for(let i = 0 ; i < n2.dynamicChildren; i++) {
    patchElement(
      n1.dynamicChildren[i],
			n2.dynamicChildren[i],
			container,
			parentComponent
    )
  }
}
// 所谓的不稳结构就是 DOM 树的结构可能会发生变化。不稳定结构有哪些呢？ （v-if/v-for/Fragment）
// 编译后的结果
`return  function render(_ctx, _cache, $props, $setup, $data, $options) {
	return (
		_openBlock(),
		_createElementBlock('div', null, [
			_ctx.flag
				? (_openBlock(),
				  _createElementBlock('div', { key: 0 }, [
						_createElementVNode(
							'span',
							null,
							_toDisplayString(_ctx.a),
							1 /* TEXT */
						)
				  ]))
				: (_openBlock(),
				  _createElementBlock('div', { key: 1 }, [
						_createElementVNode('p', null, [
							_createElementVNode(
								'span',
								null,
								_toDisplayString(_ctx.a),
								1 /* TEXT */
							)
						])
				  ]))
		])
	);
};`
// Block(div);
// Blcok(div, { key: 0 });
// Block(div, { key: 1 });
let vfor

`
<div>
	<div v-for="item in fruits">{{ item }}</div>
</div>
`
// export function render(_ctx, _cache, $props, $setup, $data, $options) {
// 	return (
// 		_openBlock(true),
// 		_createElementBlock(
// 			_Fragment,
// 			null,
// 			_renderList(_ctx.fruits, (item) => {
// 				return (
// 					_openBlock(),
// 					_createElementBlock('div', null, _toDisplayString(item), 1 /* TEXT */)
// 				);
// 			}),
// 			256 /* UNKEYED_FRAGMENT */
// 		)
// 	);
// }

// 静态提升
// export function render(_ctx, _cache, $props, $setup, $data, $options) {
// 	return (
// 		_openBlock(),
// 		_createElementBlock('div', null, [
// 			_createElementVNode('span', null, 'hello'),
// 			_createElementVNode(
// 				'span',
// 				{
// 					a: '1',
// 					b: '2'
// 				},
// 				_toDisplayString(_ctx.name),
// 				1 /* TEXT */
// 			),
// 			_createElementVNode('a', null, [
// 				_createElementVNode(
// 					'span',
// 					null,
// 					_toDisplayString(_ctx.age),
// 					1 /* TEXT */
// 				)
// 			])
// 		])
// 	);
// }

const _hoisted_1 = /*#__PURE__*/ _createElementVNode(
	'span',
	null,
	'hello',
	-1 /* HOISTED */
);
const _hoisted_2 = {
	a: '1',
	b: '2'
};

// export function render(_ctx, _cache, $props, $setup, $data, $options) {
// 	return (
// 		_openBlock(),
// 		_createElementBlock('div', null, [
// 			_hoisted_1,
// 			_createElementVNode(
// 				'span',
// 				_hoisted_2,
// 				_toDisplayString(_ctx.name),
// 				1 /* TEXT */
// 			),
// 			_createElementVNode('a', null, [
// 				_createElementVNode(
// 					'span',
// 					null,
// 					_toDisplayString(_ctx.age),
// 					1 /* TEXT */
// 				)
// 			])
// 		])
// 	);
// }

`<div @click="e=>v=e.target.value"></div>`
// export function render(_ctx, _cache, $props, $setup, $data, $options) {
// 	return (
// 		_openBlock(),
// 		_createElementBlock(
// 			'div',
// 			{
// 				onClick: (e) => (_ctx.v = e.target.value)
// 			},
// 			null,
// 			8 /* PROPS */,
// 			['onClick']
// 		)
// 	);
// }

// 缓存函数
// export function render(_ctx, _cache, $props, $setup, $data, $options) {
// 	return (
// 		_openBlock(),
// 		_createElementBlock('div', {
// 			onClick: _cache[0] || (_cache[0] = (e) => (_ctx.v = e.target.value))
// 		})
// 	);
// }
