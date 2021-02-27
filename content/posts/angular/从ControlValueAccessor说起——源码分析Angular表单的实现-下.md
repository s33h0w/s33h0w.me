---
title: 从ControlValueAccessor说起——源码分析Angular表单的实现(下)
draft: true
tags:
---
## Angular表单的设计哲学

通过对响应式表单和模板驱动式表单的数据流分析，我们看到Angular在表单内部封装了很多不为人知的操作，无需关心视图，我们仅仅处理表单模型即可。为了更好说明Angular表单的设计思想，我们首先将其和React表单进行对比。

### 对比React表单

React是一个UI库，以声明式编写UI，通过组件的状态管理视图。无论是表单还是其他，React侧重于如何根据状态正确有效地更新视图。Angular则是一个前端框架，它不仅负责视图渲染，同时提供了诸多前端问题的解决方案，表单则是其中之一。

以下我们分别用React与Angular的方式实现一个表单控件。

```javascript
// React
const ReactForm = () => {
  const [email, setEmail] = useState("");
  return (
    <div>
      Email:
      <input
        id="email"
        name="email"
        type="email"
        onChange={e => {
          setEmail(e.target.value);
        }}
        value={email}
      />
      <br />
      Value:
      <span>{email}</span>
    </div>
  );
};
```

[![Edit Form w/ React/Formik](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/form-w-reactformik-b7y4t?fontsize=14&hidenavigation=1&theme=dark)

```typescript
// Angular
@Component({
  selector: "app-reactive-form",
  template: `
    Email:
    <input type="text" [formControl]="emailControl" />
    <br />
    Value:
    <span>{{ emailControl.value }}</span>
  `
})
export class ReactiveFormComponent {
  emailControl = new FormControl("");
}
```

[![Edit Form w/ Angular/ReactiveForm](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/cranky-paper-5jqoe?fontsize=14&hidenavigation=1&theme=dark)



区别：

1.	React需要定义事件触发函数 => 单向绑定和双向绑定、onChange vs valueChanges.subscribe （事件机制）
2.	Angular需要FormControl指令 => 如何复用逻辑（指令的意义）？

引申：

1.	React与Angular对状态管理采取的不同策略: 单向+Schedule VS 单向+Reactive
2.	函数式写法和类写法的不同反应的构建React和Angular组件思路的不同: 模型是否需要对视图的变更作出反应？



## 如何创建一个表单控件

### 指令方式

### 组件方式
