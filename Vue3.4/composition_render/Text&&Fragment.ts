import {
  isSameVNodeType,
  createRenderer,
  ShapeFlags,
} from '../render-runtime/core-diff'
let options:any
const render = createRenderer(options)

export const Text = Symbol('Text')
export const Fragment = Symbol('Fragment')

// 文本类型：
// render(h(Text, 'Hello World'), document.getElementById('app));
const patch = (n1: any, n2: any, container: any, anchor?: any) => {
  if(n1 == n2) {
    return 
  }
  if(n1 && !isSameVNodeType(n1, n2)) {
    render.unmount(n1)
    n1 = null
  }
  const { type, shapeFlag } = n2
  switch(type) {
    case Text:
      processText(n1, n2, container)
      break
    case Fragment:
      processFragment(n1, n2, container)
      break
    default:
      if(shapeFlag & ShapeFlags.ELEMENT) {
        render.processElement(n1, n2, container, anchor)
      }
  }
}

const processText = (n1: any, n2: any, container: any) => {
  if (n1 == null) {
		render.options.hostInsert((n2.el = render.options.hostCreateText(n2.children)), container);
	} else {
		const el = (n2.el = n1.el);
		if (n2.children !== n1.children) {
			render.options.hostSetText(el, n2.children);
		}
	}
}

// Fragment类型
// render(
// 	h(Fragment, [h(Text, 'hello'), h(Text, 'erxiao')]),
// 	document.getElementById('app')
// );

const processFragment = (n1: any, n2: any, container: any) => {
  if(n1 == null) {
    render.mountChildren(n2.children, container)
  } else{
    render.patchChildren(n1, n2, container)
  }
}