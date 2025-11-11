import { NodeTypes } from './ast'

// 标识用于将值转换为显示字符串的辅助函数
export const TO_DISPLAY_STRING = Symbol(`toDisplayString`)
// 标识创建文本虚拟节点的辅助函数
export const CREATE_TEXT = Symbol(`createTextVNode`)
 
export const CREATE_ELEMENT_VNODE = Symbol('createElementVNode')
export const FRAGMENT = Symbol('FRAGMENT');
export const CREATE_ELEMENT_BLOCK = Symbol(`createElementBlock`);
export const OPEN_BLOCK = Symbol(`openBlock`);

export const helperNameMap: any = {
	[TO_DISPLAY_STRING]: 'toDisplayString',
  [CREATE_TEXT]: `createTextVNode`,
  [CREATE_ELEMENT_VNODE]: 'createElementVNode',
  [FRAGMENT]: 'Fragment',
	[OPEN_BLOCK]: `openBlock`, // block处理
	[CREATE_ELEMENT_BLOCK]: `createElementBlock` // 创建元素节点标识
}

export function createVNodeCall(context: any, tag: any, props: any, children: any) {
	context.helper(CREATE_ELEMENT_VNODE);
	return {
		type: NodeTypes.VNODE_CALL,
		tag,
		props,
		children
	};
}
