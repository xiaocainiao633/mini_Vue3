const hasOwnProperty = Object.prototype.hasOwnProperty

export const hasOwn = (val: any, key: any) => hasOwnProperty.call(val, key)

export const hasPropsChanged = (prevProps: any = {}, nextProps: any = {}) => {
	const nextKeys:any = Object.keys(nextProps);
	if (nextKeys.length !== Object.keys(prevProps).length) {
		return true;
	}
	for (let i = 0; i < nextKeys.length; i++) {
		const key: any = nextKeys[i];
		if (nextProps[key] !== prevProps[key]) {
			return true;
		}
	}
	return false;
};

const shouldUpdateComponent = (n1: any, n2: any) => {
	const { props: prevProps, children: prevChildren } = n1;
	const { props: nextProps, children: nextChildren } = n2;

	if (prevChildren || nextChildren) return true;

	if (prevProps === nextProps) return false;
	return hasPropsChanged(prevProps, nextProps);
};
const updateComponent = (n1: any, n2: any) => {
	const instance = (n2.component = n1.component);
	if (shouldUpdateComponent(n1, n2)) {
		instance.next = n2; // 将新的虚拟节点放到next属性上
		instance.update(); // 属性变化手动调用更新方法
	}
};

export function updateProps(prevProps : any, nextProps: any) {
	for (const key in nextProps) {
		// 循环props
		prevProps[key] = nextProps[key]; // 响应式属性更新后会重新渲染
	}
	for (const key in prevProps) {
		// 循环props
		if (!(key in nextProps)) {
			delete prevProps[key];
		}
	}
}
