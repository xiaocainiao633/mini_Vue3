// 代码转化
import { NodeTypes } from './ast'
import { 
	TO_DISPLAY_STRING, 
	CREATE_TEXT, 
	createVNodeCall,
	CREATE_ELEMENT_VNODE,
	FRAGMENT,
	CREATE_ELEMENT_BLOCK,
	OPEN_BLOCK
} from './runtimeHelper'

function isText(node: any) {
  return node.type == NodeTypes.INTERPOLATION || node.type == NodeTypes.TEXT
}

// 创建属性对象表达式
export function createObjectExpression(properties: any) {
	return {
		type: NodeTypes.JS_OBJECT_EXPRESSION, // 标识为JS对象表达式
		properties // 属性键值对数组（如 [{ key: 'class', value: 'box' }]）
	}
}

// 元素节点的转换逻辑
export function transformElement(node: any, context: any) {
	if (node.type === NodeTypes.ELEMENT) {
		return function postTransformElement() {
			// 元素处理的退出函数
			let vnodeTag = `'${node.tag}'`
			let properties = [];
			// 元素的属性数组
			let props = node.props;
			// 遍历属性，转换为键值对
			for (let i = 0; i < props.length; i++) {
				// 这里属性其实应该在codegen里在处理
				properties.push({
					key: props[i].name, // 属性名如class,id
					value: props[i].value.content // 属性值，如box,app
				});
			}
			// 生成属性对象表达式
			const propsExpression =
				props.length > 0 ? createObjectExpression(properties) : null;
			// 属性 class="box" 会被转换为 { key: 'class', value: 'box' }
			let vnodeChildren = null;
			// 单个子节点则直接使用
			if (node.children.length === 1) {
				// 只有一个孩子节点 ，那么当生成 render 函数的时候就不用 [] 包裹
				const child = node.children[0];
				vnodeChildren = child;
			} else {
				if (node.children.length > 0) {
					// 处理儿子节点
					vnodeChildren = node.children;
				}
			}
			// 代码生成
			node.codegenNode = createVNodeCall(
				context,
				vnodeTag,
				propsExpression,
				vnodeChildren
			);
		};
	}
}
// 假设AST为：
// {
//   type: NodeTypes.ELEMENT,
//   tag: 'div',
//   props: [
//     {
//       type: NodeTypes.ATTRIBUTE,
//       name: 'class',
//       value: { type: NodeTypes.TEXT, content: 'container' }
//     }
//   ],
//   children: [
//     { type: NodeTypes.TEXT, content: 'Hello World' }
//   ]
// }
// 变为
`
{
  type: NodeTypes.VNODE_CALL, // 虚拟节点调用类型
  tag: "'div'", // 标签名
  props: {
    type: NodeTypes.JS_OBJECT_EXPRESSION,
    properties: [{ key: 'class', value: 'container' }]
  },
  children: { type: NodeTypes.TEXT, content: 'Hello World' } // 单个子节点
}
`

// 合并相邻的文本节点和插值表达式
// 将合并后的文本或单个文本 / 插值转换为 TEXT_CALL 节点，便于生成 createTextVNode 调用，并添加补丁标记（patchFlag）优化更新性能
export function transformText(node: any, context: any) {
	if (node.type === NodeTypes.ELEMENT || node.type === NodeTypes.ROOT) {
		return () => {
			// 是否存在文本、插值节点
			let hasText = false
			const children = node.children;
			// 用于合并相邻节点的容器
			let currentContainer = undefined // 合并儿子

			for (let i = 0; i < children.length; i++) {
				let child = children[i];
				// 仅处理文本节点或者插值节点，进行合并
				if (isText(child)) {
					hasText = true;
					// 向后查找相邻的文本插值节点
					for (let j = i + 1; j < children.length; j++) {
						const next = children[j];
						if (isText(next)) {
							if (!currentContainer) {
								currentContainer = children[i] = {
									// 合并表达式
									type: NodeTypes.COMPOUND_EXPRESSION, // 符合表达式节点
									loc: child.loc, // 位置信息沿用第一个节点
									children: [child] // 初始包含当前节点
								};
							}
							// 合并后续节点，用+连接
							currentContainer.children.push(` + `, next);
							// 子节点移除已经合并的节点
							children.splice(j, 1);
							j--; // 修正索引
						} else {
							// 遇到非文本节点停止当前合并
							currentContainer = undefined;
							break;
						}
					}
				}
			}
			// 合并完成后，处理合并结果
			if (!hasText || children.length == 1) {
				// 无文本节点，或者只有一个节点无需合并，直接返回
				return;
			}
			// 遍历子节点，将表达式转换为TEXT_CALL
			for (let i = 0; i < children.length; i++) {
				const child = children[i];
				if (isText(child) || child.type === NodeTypes.COMPOUND_EXPRESSION) {
					const callArgs = [];
					callArgs.push(child); // 第一个参数：文本内容
					// 非纯文本节点，插值或者复合表达式，需要添加补丁标记
					if (child.type !== NodeTypes.TEXT) {
						// 如果不是文本
						// callArgs.push(PatchFlags.TEXT + '');
					}
					// 替换为TEXT_CALL节点
					children[i] = {
						type: NodeTypes.TEXT_CALL, // 最终需要变成createTextVnode() 增加patchFlag
						content: child, // 原始内容
						loc: child.loc, // 位置信息
						codegenNode: createCallExpression(context, callArgs) // 创建表达式调用
					};
				}
			}
		};
	}
}

// 仅当节点是插值表达式（INTERPOLATION）时，进入节点时执行
function transformExpression(node: any) {
	if(node.type === NodeTypes.INTERPOLATION) {
    // 修改表达式内容,在原始表达式前添加"_ctx""
    node.content.content = `_ctx.${node.content.content}`;
  }
}

// 递归遍历AST节点
function traverseNode(node: any, context: any) {
	context.currentNode = node; // 更新当前节点
  // 执行所有注册的转换函数
	const transforms = context.nodeTransforms;
	for (let i = 0; i < transforms.length; i++) {
		let onExit = transforms[i](node, context); // 调用转化方法进行转化
    if(onExit) {
      // existsFns.push(onExit)
    }
    if(!context.currentNode) return
	}
  // 递归处理子节点
	switch (node.type) {
		case NodeTypes.ELEMENT:  //元素节点
		case NodeTypes.ROOT: // 根节点
			for (let i = 0; i < node.children.length; i++) {
				context.parent = node; //更新父节点为当前节点
				traverseNode(node.children[i], context); // 递归处理子节点
			}
    case NodeTypes.INTERPOLATION:
      context.helper(TO_DISPLAY_STRING) // 用于JSON.stringify
      break
	}
}

// 创建转换上下文
function createTransformContext(root: any) {
	const context = {
		// 其他上下文属性
		removeHelper(name: any) {
			// 获取辅助函数引用次数
			const count = context.helpers.get(name);
			if (count) {
				const currentCount = count - 1
				if (!currentCount) {
					context.helpers.delete(name)
				} else {
					context.helpers.set(name, currentCount)
				}
			}
		},
		currentNode: root, // 当前正在转化节点
		parent: null, // 当前转化节点的父节点
		nodeTransforms: [ // 注册的转换函数
			// 转化方法
			transformElement, // 处理元素节点
			transformText, // 处理文本节点
			transformExpression // 处理表达式节点
		],
		helpers: new Map(), // 记录需要的辅助函数（如 h、createVNode）及调用次数
		helper(name: any) {
			const count = context.helpers.get(name) || 0;
			context.helpers.set(name, count + 1)
			return name
		}
	}
	return context
}

// 根节点代码生成配置
function createRootCodegen(root: any, context: any) {
	let { children } = root
	if (children.length == 1) {
		const child = children[0]
		// 子节点是元素节点
		if (child.type === NodeTypes.ELEMENT && child.codegenNode) {
			const codegenNode = child.codegenNode
			// 根节点的 codegenNode 直接复用子节点的 codegenNode
			root.codegenNode = codegenNode
			context.removeHelper(CREATE_ELEMENT_VNODE) // 不要创建元素
			context.helper(OPEN_BLOCK)
			context.helper(CREATE_ELEMENT_BLOCK) // 创建元素block就好了
			root.codegenNode.isBlock = true // 只有一个元素节点，那么他就是block节点
		} else {
			root.codegenNode = child // 直接用里面的节点换掉
		}
	} else {
		root.codegenNode = createVNodeCall(
			context,
			context.helper(FRAGMENT),
			undefined,
			root.children
		);
		context.helper(OPEN_BLOCK);
		context.helper(CREATE_ELEMENT_BLOCK);
		root.codegenNode.isBlock = true; // 增加block fragment
	}
}

// 转换阶段入口
export function transform(root: any) {
	// 创建转化的上下文, 记录转化方法及当前转化节点
	let context = createTransformContext(root);
	// 递归遍历
	traverseNode(root, context);
	createRootCodegen(root, context); // 生成根节点的codegen
	root.helpers = [...context.helpers.keys()];
}

export function createCallExpression(context: any, args: any) {
	let callee = context.helper(CREATE_TEXT)
	return {
		callee,
		type: NodeTypes.JS_CALL_EXPRESSION,
		arguments: args
	}
}

// 编译入口
// export function compile(template: any) {
// 	const ast = baseParse(template);
// 	transform(ast);
// }
