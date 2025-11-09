import { render, createRenderer } from '../render-runtime/core-diff'
import { updateComponentPreRender } from './setup'
let options
const renderer = createRenderer(options)

export let currentInstance: any = null;
export const setCurrentInstance = (instance: any) => (currentInstance = instance);
export const getCurrentInstance = () => currentInstance;
export const unsetCurrentInstance = () => (currentInstance = null);

export const enum LifecycleHooks {
	BEFORE_MOUNT = 'bm',
	MOUNTED = 'm',
	BEFORE_UPDATE = 'bu',
	UPDATED = 'u',
}

function createHook(type: any) {
  // 返回一个函数（如 onMounted），接收用户定义的钩子函数（hook）和目标实例（target）
	return (hook: any, target: any = currentInstance) => {
		// 调用的时候保存当前实例
		if (target) {
      // 1. 从实例上获取该类型的钩子数组，若不存在则初始化为空数组
			const hooks = target[type] || (target[type] = []);
      // 2. 包装用户的钩子函数（增强逻辑）
			const wrappedHook = () => {
				setCurrentInstance(target); // 当生命周期调用时 保证currentInstance是正确的
				hook.call(target);
				setCurrentInstance(null);
			};
      // 3. 将包装后的钩子添加到实例的钩子数组中
			hooks.push(wrappedHook);
		}
	};
}

export const onBeforeMount = createHook(LifecycleHooks.BEFORE_MOUNT);
export const onMounted = createHook(LifecycleHooks.MOUNTED);
export const onBeforeUpdate = createHook(LifecycleHooks.BEFORE_UPDATE);
export const onUpdated = createHook(LifecycleHooks.UPDATED);

export const invokeArrayFns = (fns: any) => {
	for (let i = 0; i < fns.length; i++) {
		fns[i](); // 调用钩子方法
	}
};

const componentUpdateFn = (instance: any) => {
   const { container, anchor, renderContext } = instance.type
	if (!instance.isMounted) {
		const { bm, m } = instance;
		if (bm) {
			// beforeMount
			invokeArrayFns(bm);
		}
		const subTree = render.call(renderContext, renderContext, null);
		renderer.patch(null, subTree, container, anchor);

		instance.subTree = subTree;
		instance.isMounted = true;
		if (m) {
			// mounted
			invokeArrayFns(m);
		}
	} else {
		let { next, bu, u } = instance;
		if (next) {
			updateComponentPreRender(instance, next);
		}
		if (bu) {
			// beforeUpdate
			invokeArrayFns(bu);
		}
		const subTree = render.call(renderContext, renderContext, null);
		renderer.patch(instance.subTree, subTree, container, anchor);
		if (u) {
			// updated
			invokeArrayFns(u);
		}
		instance.subTree = subTree;
	}
};
