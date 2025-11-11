// 新增的包
// {
// 	"name": "@vue/compiler-core",
// 	"version": "1.0.0",
// 	"description": "@vue/compiler-core",
// 	"main": "index.js",
// 	"module": "dist/compiler-core.esm-bundler.js",
// 	"buildOptions": {
// 		"name": "VueCompilerCore",
// 		"compat": true,
// 		"formats": ["esm-bundler", "cjs"]
// 	}
// }

import { transform } from './code_exchange'
import { generate } from './code_generate'
export function compile(template : any) {
  // 将模板转化为ast语法树
  const ast = parse(template)
  // 对语法树进行转化
  transform(ast)
  // 生成代码
  return generate(ast)
}
// 语法树相关类型
export const enum NodeTypes {
	ROOT, // 根节点
	ELEMENT, // 元素
	TEXT, // 文本
	COMMENT, // 注释
	SIMPLE_EXPRESSION, // 简单表达式
	INTERPOLATION, // 模板表达式
	ATTRIBUTE,
	DIRECTIVE,
	// containers
	COMPOUND_EXPRESSION, // 复合表达式
	IF,
	IF_BRANCH,
	FOR,
	TEXT_CALL, // 文本调用
	// codegen
	VNODE_CALL, // 元素调用
	JS_CALL_EXPRESSION, // js调用表达式,
	JS_OBJECT_EXPRESSION // js对象表达式
}

// 创建解析上下文
function createParserContext(content: any) {
	return {
		line: 1, // 当前解析到的行号
		column: 1, // 当前解析到的列号
		offset: 0, // 当前解析到的字符串偏移量
		source: content, // 待解析的剩余字符串,source会不停的被截取
		originalSource: content // 原始模板字符串
	};
}

// 判断解析是否完成
function isEnd(context: any) {
	const source = context.source;
	if(context.source.startsWith('</')) {
		// 如果剩余源码以 </ 开头（遇到结束标签），则子节点解析结束
		return true
	}
	// 当前剩余解析字符串为空时,解析结束
	return !source;
}

// 解析子节点,核心逻辑
function parseChildren(context: any) {
	const nodes: any = []; // 存储解析生成的所有节点,最终返回的AST节点数组
	// 循环解析,直到模板结束
	while (!isEnd(context)) {
		// 当前待解析的剩余字符串
		const s = context.source;
		// 存储当前生成的单个节点
		let node;
		// 解析插值表达式
		if (s.startsWith('{{')) {
			// 处理表达式类型
		} else if (s[0] === '<') { // 解析标签
			// 标签的开头
			if (/[a-z]/i.test(s[1])) {
			} // 开始标签
		}
		// 解析为文本节点
		if (!node) {
			// 文本的处理
		}
		nodes.push(node);
	}
	for(let i = 0 ; i < nodes.length ; i++) {
		const node = nodes[i]
		if(node.type == NodeTypes.TEXT) {
			// 如果是文本 删除空白文本，其他的空格变为一个
			if (!/[^\t\r\n\f ]/.test(node.content)) {
				nodes[i] = null;
			} else {
				node.content = node.content.replace(/[\t\r\n\f ]+/g, ' ');
			}
		}
	}
	return nodes.filter(Boolean);
}

// 解析入口函数
function parse(template: any) {
	// 创建解析上下文
	const context = createParserContext(template);
	const start = getCursor(context)
	// 3. 解析所有子节点（递归解析模板中的元素、文本、插值等）
  const children = parseChildren(context);
	return createRoot(parseChildren(context), getSelection(context, start));
}

// 处理文本节点
function parseText(context: any) {
	// 123123{{name}}</div> → 示例模板片段，需要解析 "123123" 这部分文本
	const endTokens = ['<', '{{'] // 文本结束的标记,两种开头方式
	// 初始假设:文本是整个剩余字符串的长度
	let endIndex = context.source.length
	// 遍历结束标记,找到最近的结束位置
	for(let i = 0 ; i < endTokens.length ; i++) {
		// 从索引1开始查找
		const index = context.source.indexOf(endTokens[i], 1)
		// 若找到标记，且该位置比当前 endIndex 更近，则更新 endIndex
		if(index !== -1 && endIndex > index) {
			endIndex = index
		}
	}
	// endIndex代表文本的结束位置
	// 获取文本开始时的光标位置
	let start = getCursor(context)
	// 提取文本内容
	const content = parseTextData(context, endIndex)

	return {
		type: NodeTypes.TEXT, // 节点类型:文本
		content, // 文本内容
		loc: getSelection(context, start) // 生成位置信息
	}
}

function getCursor(context: any) {
	// 从上下文提取当前行号,列号,偏移量
	let { line, column, offset } = context
	return { line, column, offset }
}

function parseTextData(context: any, endIndex: any) {
	// 截取0到endIndex的文本
	const rawText = context.source.slice(0, endIndex)
	// 移除已经解析的文本部分
	advanceBy(context, endIndex)
	// 返回提取的文本内容
	return rawText
}

// 截取源码
function advanceBy(context: any, endIndex: any) {
	let s = context.source // 当前剩余的源码
	// 根据截取的长度更新上下文信息
	advancePositionWithMutation(context, s, endIndex)
	// 截取源码,移除已经解析的部分
	context.source = s.slice(endIndex)
}

// 精确更新位置信息
function advancePositionWithMutation(context: any, s: any, endIndex: any) {
	let linesCount = 0 // 记录解析过程中换行符数量
	let linePos = -1 // 记录最后一个换行符的位置

	// 遍历截取的文本,统计换行符
	for(let i = 0 ; i < endIndex; i++) {
		if(s.charCodeAt(i) === 10) { // '\n'的ASCII码
			linesCount++ // 每遇到一个换行符,行数加一
			linePos = i // 更新最后一个换行符的位置
		}
	}
	// 更新偏移量
	context.offset += endIndex
	// 更新行号,累加遇到的换行符数量
	context.line += linesCount
	// 更新列号
	//  - 若没有换行（linePos = -1）：当前列号 + 已解析的字符数
  //  - 若有换行：最后一个换行符到文本末尾的长度（即新行的列号从 1 开始计算）
	context.column = linePos === -1 ? context.column + endIndex : endIndex - linePos
}

// 生成节点的完整位置信息
function getSelection(context: any, start: any, End?: any) {
	const end = End || getCursor(context) // 获取当前位置
	return {
		start, // 开始位置
		end, // 结束位置
		source: context.originalSource.slice(start.offset, end.offset) // 节点对应的原始文本
	}
}

// 处理插值表达式节点
function parseInterpolation(context: any) {
	const start = getCursor(context); // 获取表达式的开头位置
	const closeIndex = context.source.indexOf('}}', 2); // 找到结束位置

	advanceBy(context, 2); // 去掉  {{
	const innerStart = getCursor(context); // 计算里面开始和结束
	const innerEnd = getCursor(context);

	const rawContentLength = closeIndex - 2; // 拿到内容
	const preTrimContent = parseTextData(context, rawContentLength);
	// 去除首尾空格
	const content = preTrimContent.trim();
	// 找到有效表达式在原始内容中的起始索引（跳过前导空格）
	const startOffest = preTrimContent.indexOf(content);
	if (startOffest > 0) {
		// 有空格
		advancePositionWithMutation(innerStart, preTrimContent, startOffest); // 计算表达式开始位置
	}
	// 计算有效表达式的结束索引(起始索引 + 有效内容长度)
	const endOffset = content.length + startOffest;
	advancePositionWithMutation(innerEnd, preTrimContent, endOffset);
	//  消费（移除）结束标记 }}（长度为 2）
	advanceBy(context, 2);
	// 返回插值节点
	return {
		type: NodeTypes.INTERPOLATION, //插值类型
		content: {
			type: NodeTypes.SIMPLE_EXPRESSION, // 简单表达式类型
			isStatic: false, // 非静态
			content, // 表达式内容
			loc: getSelection(context, innerStart, innerEnd) // 表达式在模板中的位置
		},
		// 整个插值的位置
		loc: getSelection(context, start)
	};
}

// 处理标签
function advanceSpaces(context: any) {
	// 匹配开头的空白字符
	const match = /^[ \t\r\n]+/.exec(context.source)
	// 若匹配到,移除这些字符,更新上下文位置
	if(match) {
		advanceBy(context, match[0].length)
	}
}

// 解析单个标签
function parseTag(context: any) {
	// 记录标签的开始位置
	const start = getCursor(context)
	// 匹配标签名（支持开始标签 <div 或结束标签 </div）
  // 正则说明：
  // ^<\/? → 匹配开头的 < 或 </（/？表示可选的 /）
  // ([a-z][^ \t\r\n/>]*) → 匹配标签名（以小写字母开头，后面跟非空白、非/、非>的字符）
	const match: any = /^<\/?([a-z][^ \t\r\n/>]*)/.exec(context.source); 
	const tag = match[1] //提取标签名 如div,img
	// 移除已匹配的标签名部分（如 '<div' 或 '</div'）
	advanceBy(context, match[0].length)
	// 跳过标签名后的空白字符（如 <div  class> 中的空格）
	advanceSpaces(context)
	let props = parseAttributes(context) // 处理属性
	// 判断是否是自闭合标签如<img/>
	const isSelfClosing = context.source.startsWith('/>')
	// 6. 消费（移除）标签的闭合部分：
  //  - 自闭合标签：移除 '/>'（长度 2）
  //  - 非自闭合标签：移除 '>'（长度 1）
	advanceBy(context, isSelfClosing ? 2 : 1)
	return {
		type: NodeTypes.ELEMENT, // 节点类型:元素
		tag, // 标签名
		isSelfClosing, // 是否自闭合
		loc: getSelection(context, start), // 标签的位置信息（从 < 到闭合符的范围）
		props,
	}
}

function parseElement(context: any) {
	// 解析开始标签
	let ele = parseTag(context)
	// 2. 解析子节点（文本、插值、其他元素等），直到遇到当前元素的结束标签
	let children = parseChildren(context)
	// 若后续是结束标签（如 </div>），则解析结束标签
  if (context.source.startsWith('</')) {
    parseTag(context); // 解析结束标签，更新上下文（消费掉 </div>）
  }
	// 更新元素的位置信息（结束位置为整个元素的结束，即结束标签的 > 位置）
  ele.loc = getSelection(context, ele.loc.start);
	// 5. 为元素添加子节点数组
	(ele as any).children = children 
  // 返回完整的元素节点
  return ele;
}

// 属性处理,负责提取标签中的所有属性,如class,id,等
function parseAttributes(context: any) {
	// 储存解析后的属性节点
	const props = []
	// 循环条件：还有剩余源码，且未遇到标签结束符 ">"
	while (context.source.length > 0 && !context.source.startsWith('>')) {
		// 解析单个属性
		const attr = parseAttribute(context)
		// 将属性添加到数组
		props.push(attr)
		// 跳过后面的空白字符
		advanceSpaces(context)
	}
	return props
}

// 解析单个属性
function parseAttribute(context: any) {
	// 记录开始的位置
	const start = getCursor(context)
	// 1. 匹配属性名（如 class、id、@click）
  // 正则说明：
  // ^[^\t\r\n\f />] → 第一个字符不能是空白、/、>
  // [^\t\r\n\f />=]* → 后续字符不能是空白、/、>、=（避免包含属性值部分）
  const match = /^[^\t\r\n\f />][^\t\r\n\f />=]*/.exec(context.source)!;
	const name = match[0] // 提取属性名 如class
	// 移除已解析的属性名
	advanceBy(context, name.length)
	let value // 存储属性值,如disabled

	// 3. 判断属性是否有值（通过是否包含 "=" 且前后可能有空白）
  if (/^[\t\r\n\f ]*=/.test(context.source)) { 
    // 3.1 跳过 "=" 前后的空白字符
    advanceSpaces(context) 
    // 3.2 消费 "=" 本身
    advanceBy(context, 1)
    // 3.3 跳过 "=" 后的空白字符
    advanceSpaces(context) 
    // 3.4 解析属性值（如 "box"、"app"）
    value = parseAttributeValue(context) 
  }
  // 4. 生成属性的位置信息（从 start 到当前位置）
  const loc = getSelection(context, start)

	// 返回结构化的属性节点 
	return {
    type: NodeTypes.ATTRIBUTE, // 节点类型：属性
    name, // 属性名（如 "class"）
    value: value 
      ? { // 有值时：包装为文本节点（包含内容和位置）
          type: NodeTypes.TEXT,
          content: value.content,
          loc: value.loc
        }
      : null, // 无值时：null（如 disabled）
    loc // 属性整体的位置信息
  };
}

// 解析属性值
function parseAttributeValue(context: any) {
  const start = getCursor(context); // 记录属性值的开始位置
  const quote = context.source[0]; // 获取第一个字符（判断是否是引号）
  let content; // 存储属性值内容

  // 判断是否是带引号的值（双引号 " 或单引号 '）
  const isQuoted = quote === '"' || quote === "'"; 

  if (isQuoted) {
    // 1. 消费开头的引号（" 或 '）
    advanceBy(context, 1); 
    // 2. 找到闭合引号的位置（值的结束位置）
    const endIndex = context.source.indexOf(quote); 
    // 3. 提取引号之间的内容（如 "box" 中的 "box"）
    content = parseTextData(context, endIndex); 
    // 4. 消费闭合的引号
    advanceBy(context, 1); 
  } else {
    // （简化逻辑：非引号包裹的值，如某些 HTML 中的简写，此处未实现）
  }

  // 返回值内容和位置信息
  return { 
    content, // 属性值内容（如 "box"）
    loc: getSelection(context, start) // 值的位置信息（包含引号）
  };
}

// 创建根节点
export function createRoot(children: any, loc: any) {
	return {
		type: NodeTypes.ROOT,
		children,
		loc
	}
}

// 假设模板字符串为:
// <div class="app">
//   Hello {{ name }}!
// </div>
// 解析后生成的AST结构为:
`
{
  type: NodeTypes.ROOT, // 根节点
  children: [ // 顶级子节点（这里只有一个 div 元素）
    {
      type: NodeTypes.ELEMENT,
      tag: 'div',
      props: [ // div 的属性
        {
          type: NodeTypes.ATTRIBUTE,
          name: 'class',
          value: { type: NodeTypes.TEXT, content: 'app', ... },
          ...
        }
      ],
      children: [ // div 的子节点（文本和插值）
        { type: NodeTypes.TEXT, content: 'Hello ', ... },
        { 
          type: NodeTypes.INTERPOLATION,
          content: { type: NodeTypes.SIMPLE_EXPRESSION, content: 'name', ... },
          ...
        },
        { type: NodeTypes.TEXT, content: '!', ... }
      ],
      ...
    }
  ],
  loc: { // 整个模板的位置信息
    start: { line: 1, column: 1, offset: 0 },
    end: { line: 3, column: 7, offset: 35 }, // 假设模板总长度 35
    source: '<div class="app">\n  Hello {{ name }}!\n</div>'
  }
}`