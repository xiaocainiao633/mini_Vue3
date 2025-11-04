export const nodeOps = {
  insert: (child: any, parent: any, anchor: any) => {
    // 添加节点
    parent.insertBefore(child, anchor || null)
  },
  remove: (child: any) => {
    const parent = child.parentNode
    if(parent) {
      parent.removeChild(child)
    }
  },
  createElement: (tag: any) => document.createElement(tag), // 创建节点
	createText: (text: any) => document.createTextNode(text), // 创建文本
	setText: (node: any, text: any) => (node.nodeValue = text), //  设置文本节点内容
	setElementText: (el: any, text: any) => (el.textContent = text), // 设置文本元素中的内容
	parentNode: (node: any) => node.parentNode, // 父亲节点
	nextSibling: (node: any) => node.nextSibling, // 下一个节点
	querySelector: (selector: any) => document.querySelector(selector) // 搜索元素
}

