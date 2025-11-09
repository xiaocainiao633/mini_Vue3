import { Fragment, processFragment } from './Text&&Fragment'
import { ShapeFlags } from '../render-runtime/core-diff'
import { processComponent } from './composition'
import { createRenderer } from '../render-runtime/core-diff'
import { currentInstance } from './apiLifecycle'

let options
const renderer = createRenderer(options)

const patch = (n1: any, n2: any, container: any, anchor: any = null, parentComponent = null) => {
  let type: any
  let shapeFlag:any
	switch (type) {
		case Fragment: // 无用的标签
			processFragment(n1, n2, container, parentComponent);
			break;
		default:
			if (shapeFlag & ShapeFlags.ELEMENT) {
				renderer.processElement(n1, n2, container, anchor, parentComponent);
			} else if (shapeFlag & ShapeFlags.COMPONENT) {
				processComponent(n1, n2, container, anchor, parentComponent);
			}
	}
};

export function provide(key: any, value: any) {
  // 若当前没有直接返回
	if (!currentInstance) return;
  // 获取父组件的provides对象
	const parentProvides =
		currentInstance.parent && currentInstance.parent.provides;
	let provides = currentInstance.provides; // 获取当前实例的provides属性
	// 如果是同一个对象，就创建个新的，下次在调用provide不必重新创建
	// provides('a', 1);
	// provides('b', 2)
	if (parentProvides === provides) {
		provides = currentInstance.provides = Object.create(provides); // 创建一个新的provides来存储
	}
	provides[key] = value;
}

export function inject(key: any, defaultValue: any) {
	if (!currentInstance) return;
  // 获取provides对象
	const provides = currentInstance.parent.provides;
  // 若提供链中存在该 key，则返回对应值
	if (provides && key in provides) {
		return provides[key];
     // 若不存在，且传入了默认值，则返回默认值
	} else if (arguments.length > 1) {
		return defaultValue;
	}
}

