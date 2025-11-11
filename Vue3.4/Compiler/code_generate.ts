import { 
  helperNameMap,
  TO_DISPLAY_STRING,
  OPEN_BLOCK,
  CREATE_ELEMENT_BLOCK,
  CREATE_ELEMENT_VNODE
} from './runtimeHelper'
import { NodeTypes } from './ast'

function isString(val: any) {
  return (typeof val === 'string' && val !== null) ? true : false
}

// 代码生成阶段上下文管理工具，生成什么代码
function createCodegeContext() {
	const context = {
		code: ``,
		indentLevel: 0,
    // 引用辅助函数
		helper(key: any) {
      // 将辅助函数的 Symbol 标识（如 OPEN_BLOCK）转换为带前缀 _ 的函数名（如 _openBlock）
			return `_${helperNameMap[key]}`;
		},
    // 拼接代码
		push(code: any) {
			context.code += code;
		},
    // 增加缩进并换行
		indent() {
			// 前进
			newline(++context.indentLevel);
		},
    // 减少缩进
		deindent(withoutnewline = false) {
			// 缩进
			if (withoutnewline) {
				--context.indentLevel; // 不换行，直接减少缩进层级
			} else {
				newline(--context.indentLevel); // 换行后减少缩进层级
			}
		},
    // 换行并保持当前缩进
		newline() {
			newline(context.indentLevel);
		} // 换行
	};

	function newline(n: any) {
    // 生成\n和n级缩进
		context.push('\n' + `  `.repeat(n));
	}
	return context;
}
// 例子：
// 创建代码生成上下文
// const context = createCodegenContext();

// // 开始生成代码
// context.push('function render(_ctx) {');
// context.indent(); // 进入函数体，缩进+1

// context.push('return (');
// context.indent(); // 进入返回值，缩进+2

// // 调用辅助函数
// context.push(`${context.helper(OPEN_BLOCK)}(), `);
// context.push(`${context.helper(CREATE_ELEMENT_BLOCK)}('div', null, 'Hello')`);

// context.deindent(); // 退出返回值，缩进-1
// context.push(')');

// context.deindent(); // 退出函数体，缩进-1
// context.push('}');

// // 最终生成的 code：
// console.log(context.code);

`function render(_ctx) {
  return (
    _openBlock(), _createElementBlock('div', null, 'Hello')
  )
}`

// 生成文本代码：let r = compile('hello, erxiao');

function genText(node: any, context: any) {
  // 将文本内容转换为JSON字符串
  context.push(JSON.stringify(node.context))
}

// 生成函数前置代码
function genFunctionPreamble(ast: any, context: any) {
	// 生成函数
	const { push, newline } = context
	if (ast.helpers.length > 0) {
		// 生成导入语句
		push(
			`const {${ast.helpers
				.map((s: any) => `${helperNameMap[s]}:_${helperNameMap[s]}`)
				.join(', ')}} = Vue`
		);
	}
	newline() // 换行
	push(`return `) // 为函数声明做铺垫
}

// 节点类型分发
function genNode(node: any, context: any) {
	switch (node.type) {
		case NodeTypes.TEXT:
      // 文本节点
			genText(node, context);
			break
    case NodeTypes.INTERPOLATION:
      // 插值接点
      genInterpolation(node, context)
      break
    case NodeTypes.SIMPLE_EXPRESSION:
      // 简单表达式节点
      genExpression(node, context)
      break
    case NodeTypes.VNODE_CALL: // 元素调用
      genVNodeCall(node, context)
      break
	}
}

export function generate(ast: any) {
  // 创建代码生成上下文
	const context = createCodegeContext();
	const { push, indent, deindent } = context;
  // 生成的函数前置代码
	genFunctionPreamble(ast, context);
  // 定义render函数名和参数
	const functionName = 'render';
	const args = ['_ctx', '$props']; // 对应组件上下文和props
  // 生成函数声明的框架
	push(`function ${functionName}(${args.join(', ')}){`);
	indent();
  // 生成return
	push(`return `);
	if (ast.codegenNode) {
    // 若根节点有 codegenNode（转换阶段生成的代码元数据），则处理该节点
		genNode(ast.codegenNode, context);
	} else {
		push(`null`);
	}
	deindent()
	push(`}`)
	return context.code;
}

const ast = {
  helpers: [], // 无辅助函数
  codegenNode: {
    type: NodeTypes.TEXT,
    content: 'Hello World'
  }
};
`const {} = Vue

return function render(_ctx, $props){
  return "Hello World"
}`

// 生成表达式代码：let r = compile('{{age}}');
// 处理简单表达式节点
function genExpression(node: any, context: any) {
	const { content } = node; // 表达式内容（如 "_ctx.msg"、"_ctx.user.name"）
	context.push(content); // 直接将表达式内容拼到代码中
}

// 处理插值节点
function genInterpolation(node: any, context: any) {
	const { push, helper } = context;
  // 1. 生成字符串化辅助函数调用（如 _toDisplayString(）
	push(`${helper(TO_DISPLAY_STRING)}(`);
  // 2. 递归处理插值内部的表达式（如 {{ msg }} 中的 msg → _ctx.msg）
	genNode(node.content, context);
	push(`)`);
}
`
{{ user.name }} 经过处理后：
解析阶段：
{
  type: NodeTypes.INTERPOLATION,
  content: { type: NodeTypes.SIMPLE_EXPRESSION, content: 'user.name' }
}

转换阶段：
{
  type: NodeTypes.INTERPOLATION,
  content: { type: NodeTypes.SIMPLE_EXPRESSION, content: '_ctx.user.name' }
}
代码生成阶段：生成可执行代码
genNode 识别到 INTERPOLATION 类型，调用 genInterpolation。
genInterpolation 生成 _toDisplayString(，再调用 genNode 处理内部表达式。
genNode 识别到 SIMPLE_EXPRESSION 类型，调用 genExpression 输出 _ctx.user.name。
最终拼接为 _toDisplayString(_ctx.user.name)
`

// 生成元素表达式：let r = compile(`<div a='1' b='2'>123</div>`);
// 生成节点列表代码
function genNodeList(nodes: any, context: any) {
	// 生成节点列表，用","分割
	const { push } = context;
	for (let i = 0; i < nodes.length; i++) {
		const node = nodes[i];
    // 处理不同类型的节点：
		if (isString(node)) {
			push(`${node}`); // 如果是字符串直接放入
		} else if (Array.isArray(node)) {
      // 数组递归处理
			genNodeList(node, context);
		} else {
      // 其他节点通过genNode处理，如属性对象、子节点
			genNode(node, context);
		}
    // 非最后一个节点，添加逗号分割
		if (i < nodes.length - 1) {
			push(', ');
		}
	}
}
// 将数组形式的节点列表（如 [tag, props, children]）转换为用逗号分隔的代码片段（如 'div', { class: 'box' }, 'Hello'）

// 生成虚拟节点创建函数调用 
function genVNodeCall(node: any, context: any) {
	const { push, helper } = context;
	const { tag, props, children, isBlock } = node; // 从VNODE_CALL节点获取信息

  // 块级节点：先调用openBlock初始化块上下文
	if (isBlock) {
		push(`(${helper(OPEN_BLOCK)}(),`);
	}
	// 生成createElementBlock或者createElementVnode
	const callHelper = isBlock ? CREATE_ELEMENT_BLOCK : CREATE_ELEMENT_VNODE;
	push(helper(callHelper));
  // 生成函数参数列表
	push('(');
  // 处理参数
	genNodeList(
		[tag, props, children].map((item) => item || 'null'),
		context
	);
	push(`)`);
	if (isBlock) {
		push(`)`);
	}
}

`{
  type: NodeTypes.VNODE_CALL,
  tag: "'div'", // 标签名（字符串形式）
  props: { type: NodeTypes.JS_OBJECT_EXPRESSION, properties: [{ key: 'class', value: 'box' }] },
  children: { type: NodeTypes.TEXT, content: 'Hello' },
  isBlock: true // 块级节点
}
(_openBlock(), _createElementBlock('div', { class: 'box' }, 'Hello'))
`

// 生成元素属性