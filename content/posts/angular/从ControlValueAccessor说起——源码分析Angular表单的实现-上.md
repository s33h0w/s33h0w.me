---
title: 从ControlValueAccessor说起——源码分析Angular表单的实现(上)
date: 2020-01-07 16:36:47
tags: Angular
---
Angular是一个MVC类框架，Angular表单可以分为模型与视图两部分。`ControlValueAccessor`是表单模型和原生视图之间连接的一个桥梁。本篇文章以`ControlValueAccessor`为切入点来逐步认识Angular表单是如何实现的，以及Angular表单的设计哲学，并在最后介绍如何创建表单控件。
<!--more-->

## `ControlValueAccessor`做了哪些事情

让我们首先来认识一下`ControlValueAccessor`。作为模型与视图之间连接的一个桥梁，`ControlValueAccessor`必然需要具备**变更视图**和**响应视图变更**的能力。

`ControlValueAccessor`只是一个接口(`Interface`)，不具备真正的方法。因此我们找一个实现了这个接口的类进行分析，这里我们选择`DefaultValueAccessor`。`DefaultValueAccessor`是一个指令(`Directive`)，匹配`input`类型的表单元素，现摘录其部分代码如下。

```typescript
@Directive({
  selector:
      'input:not([type=checkbox])[formControlName],textarea[formControlName],input:not([type=checkbox])[formControl],textarea[formControl],input:not([type=checkbox])[ngModel],textarea[ngModel],[ngDefaultControl]',
  host: {
    '(input)': '$any(this)._handleInput($event.target.value)',
  },
})
export class DefaultValueAccessor implements ControlValueAccessor {
	constructor(
      private _renderer: Renderer2, private _elementRef: ElementRef,
      @Optional() @Inject(COMPOSITION_BUFFER_MODE) private _compositionMode: boolean) {
    if (this._compositionMode == null) {
      this._compositionMode = !_isAndroid();
    }
  }

  onChange = (_: any) => {};

	writeValue(value: any): void {
    const normalizedValue = value == null ? '' : value;
    this._renderer.setProperty(this._elementRef.nativeElement, 'value', normalizedValue);
  }

  registerOnChange(fn: (_: any) => void): void { this.onChange = fn; }

  _handleInput(value: any): void {
    if (!this._compositionMode || (this._compositionMode && !this._composing)) {
      this.onChange(value);
    }
  }

  ...
}
```

_顺便提下，观察`@Directive`的`selector`部分可以发现，`DefaultValueAccessor`会被响应式表单(`FormControlName`、`FormControlDirective`)和模板驱动表单(`ngModel`)同时使用。之后我们在分析响应式和模板驱动的数据流时便无需考虑`ControlValueAccessor`的异同。_

### 变更视图

现在让我们思考一下，如果想要变更视图，那么一定需要提供一个向原生元素赋值的方法。

于是很容易便能发现在`writeValue`方法中，`DefaultValueAccessor`通过`Renderer.setProperty`方法向原生元素写入值。因此`DefaultValueAccessor`是可以变更视图的。

### 响应视图变更

接下来再看`DefaultValueAccessor`如何响应视图变更。前面已经提到`DefaultValueAccessor`用来匹配`input`类型的表单元素，因此视图变更指的就是`input`事件。

我们注意到在`@Directive`装饰器的`host`内，宿主元素的`input`事件被映射到`this._handleInput`方法中，该方法内执行了`this.onChange(value)`。而`onChange`方法在`registerOnChange`中被传入的参数注册赋值。也就是说，如果我们提前将"一些行为"作为参数传递给`DefaultValueAccessor.registerOnChange`，那么当视图变更的时候，就会执行"这些行为"，以此响应视图变更事件。不难想象，"这些行为"里可能包含"改变模型的值"、"触发ngOnChange"等等。

下面的图示说明了`ControlValueAccessor`是如何连接模型与视图的。

![ControlValueAccessor是连接模型与视图的桥梁](http://assets.processon.com/chart_image/5e072790e4b0bb7c58d4ff2c.png)

可以看到，`ControlValueAccessor`这个指令可以赋予表单控件变更视图与响应视图变更的能力。这是Angular实现表单控件的基础。

### 什么是表单模型

我们已经知道`ControlValueAccessor`是连接模型与视图的桥梁，那么请再思考一下：什么是表单模型？响应式表单和模板驱动表单的表单模型一样吗？

这里先给出答案，无论是在响应式表单还是模板驱动表单，表单模型都指的是[`FormControl`](https://angular.cn/api/forms/FormControl)。接下来的篇章中我们会仔细分析响应式表单和模板驱动表单中模型与视图之间数据的流动。

## 响应式表单和模板驱动表单中的数据流

响应式表单(Reactive Form)和模板驱动表单(Template-driven Form)是Angular提供的两种不同的表单处理方式。我们会通过分析"从视图到模型"与"从模型到视图"的数据流来比较两者实现方式的异同。

### 响应式表单

下面是一个响应式表单控件。

```typescript
import { Component } from '@angular/core';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'app-reactive-favorite-color',
  template: `
    Favorite Color: <input type="text" [formControl]="favoriteColorControl">
  `
})
export class FavoriteColorComponent {
  favoriteColorControl = new FormControl('');
}
```

#### `FormControlDirective`

观察表单控件的模板`<input type="text" [formControl]="favoriteColorControl">`，我们发现它有一个[属性型指令](https://angular.cn/guide/attribute-directives)——`[formControl]`。`formControl`被绑定为组件的`favoriteColorControl` 属性，这是一个`FormControl`实例。

问题来了，如何同步视图（`input`元素）与模型（`FormConrol`实例）呢？

前面已经讲述了`ControlValueAccessor`可以**变更视图**（`writeValue`）和**响应视图变更**(`onChange`)。然而，到底是谁调用了`ControlValueAccessor.wirteValue`去变更视图，又是谁调用了`ControlValueAccessor.registerOnChange`注册了响应视图变更的函数？显然组件本身的代码中不包含这些，一定还有一个中间人在穿针引线。如何去寻找这个中间人？

响应式表单的最明显的特征就是`[formControl]`这个属性型指令，通过查找选择器为`[formControl]`的指令，我们发现了[`FormControlDirective`](https://angular.cn/api/forms/FormControlDirective)。下面是`FormControlDirective`的部分代码。

```typescript
// FormControlDirective
@Directive({selector: '[formControl]', providers: [formControlBinding], exportAs: 'ngForm'})
export class FormControlDirective extends NgControl implements OnChanges {
  @Input('formControl') form !: FormControl;

	ngOnChanges(changes: SimpleChanges): void {
    if (this._isControlChanged(changes)) {
      setUpControl(this.form, this);
    if (this.control.disabled && this.valueAccessor !.setDisabledState) {
      this.valueAccessor !.setDisabledState !(true);
    }
    this.form.updateValueAndValidity({emitEvent: false});
    }
    if (isPropertyUpdated(changes, this.viewModel)) {
      _ngModelWarning(
        'formControl', FormControlDirective, this, this._ngModelWarningConfig);
      this.form.setValue(this.model);
      this.viewModel = this.model;
    }
  }

  ...
}
// setUpControl
export function setUpControl(control: FormControl, dir: NgControl): void {
   setUpViewChangePipeline(control, dir);
   setUpModelChangePipeline(control, dir);
  ...
}
```

可以看出，`FormControlDirective`通过选择器`[formControl]`匹配响应式表单控件，并接受`[formControl]`作为它的一个输入属性。

在`FormControlDirective`刚开始接收一个`FormControl`输入属性时，它就将`FormControl`实例注册给两个函数——`setUpViewChangePipeline`和`setUpModelChangePipeline`。这两个函数分别代表着"从视图到模型"和"从模型到视图"两个过程。

#### 从视图到模型

```typescript
function setUpViewChangePipeline(control: FormControl, dir: NgControl): void {
  dir.valueAccessor !.registerOnChange((newValue: any) => {
    control._pendingValue = newValue;
    control._pendingChange = true;
    control._pendingDirty = true;

    if (control.updateOn === 'change') updateControl(control, dir);
  });
}


function updateControl(control: FormControl, dir: NgControl): void {
  if (control._pendingDirty) control.markAsDirty();
  control.setValue(control._pendingValue, {emitModelToViewChange: false});
  dir.viewToModelUpdate(control._pendingValue);
  control._pendingChange = false;
}
```

可以看到，`setUpViewChangePipeline`仅仅调用了`valueAccessor.registerOnChange`，去注册响应视图变更的函数。因此，当视图变更的时候，将会执行`updateControl`，赋值给`FormControl`，这就是"从视图到模型"的数据流。

#### 从模型到视图

```typescript
function setUpModelChangePipeline(control: FormControl, dir: NgControl): void {
  control.registerOnChange((newValue: any, emitModelEvent: boolean) => {
    // control -> view
    dir.valueAccessor !.writeValue(newValue);

    // control -> ngModel
    if (emitModelEvent) dir.viewToModelUpdate(newValue);
  });
}
```

`setUpModelChangePipeline`也注册(`control.registerOnChange`)了一个响应变更的函数，不过不是视图变更(`input` event)，而是模型变更(`FormControl.valueChanges`)。Angular官方文档中如此描述`FormControl`的`registerOnChange`方法：“Register a listener for change events”。因此，当模型发生变更时，将会执行`valueAccessor.writeValue`，将值写入视图，从而实现视图的变更。这就是"从模型到视图"的数据流。

下面的图示以`FormControlDirective`为例表明了在响应式表单中的数据流动情况。

![响应式表单](http://assets.processon.com/chart_image/5e0874bce4b0bb7c58d68651.png)

### 模板驱动表单

下面是一个模板驱动式表单控件。

```typescript
import { Component } from '@angular/core';

@Component({
  selector: 'app-template-favorite-color',
  template: `
    Favorite Color: <input type="text" [(ngModel)]="favoriteColor">
  `
})
export class FavoriteColorComponent {
  favoriteColor = '';
}
```

#### `NgModel`

和响应式表单一样，模板驱动表单也需要一个中间人来控制`ControlValueAccessor`，从而变更视图和响应视图变更。这个中间人是[`NgModel`](https://angular.cn/api/forms/NgModel)，它也是一个指令。它通过选择器`[ngModel]:not([formControlName]):not([formControl])`来匹配模板驱动表单。

和`FormControlDirective`一样，`NgModel`也是通过`FormControl`做为模型去映射视图。下面是这两个指令的部分代码。

```typescript
// FormControlDirective
@Directive({selector: '[formControl]', providers: [formControlBinding], exportAs: 'ngForm'})
export class FormControlDirective extends NgControl implements OnChanges {
  @Input('formControl') form !: FormControl;
  ...
}

// NgModel
@Directive({
  selector: '[ngModel]:not([formControlName]):not([formControl])',
  providers: [formControlBinding],
  exportAs: 'ngModel'
})
export class NgModel extends NgControl implements OnChanges, OnDestroy {
  public readonly control: FormControl = new FormControl();
  @Input('ngModel') model: any;
  @Output('ngModelChange') update = new EventEmitter();
  // this.model变化时调用该函数，传入的参数为this.model
  private _updateValue(value: any): void {
    resolvedPromise.then(
        () => { this.control.setValue(value, {emitViewToModelChange: false}); });
  }
  viewToModelUpdate(newValue: any): void {
    this.viewModel = newValue;
    this.update.emit(newValue);
  }
  ...
}
```

由于`NgModel`不会像`FormControlDirective`那样接受一个`FormControl`实例作为属性，因此它在指令内部自己创建了一个`FormControl`实例，并且使用`_updateValue`将从控件获取的值`this.model`赋值给这个`FormControl`实例。接下来就和`FormControlDirective`一样了，`NgModel`会将自己创建的`FormControl`实例注册给`setUpViewChangePipeline`和`setUpModelChangePipeline`，从而实现"从视图到模型"和"从模型到视图"的数据流动。

#### 从视图到模型

再次回到[`setUpViewChangePipeline`](####从视图到模型)，我们发现视图变更除了会赋值给`FormControl`之外，还会执行`dir.viewToModelUpdate`（此处的`dir`使用的是`NgModel`实例），也就是触发`ngModelChange`事件。如果表单控件采用了双向绑定（比如我们的示例表单控件中的`[(ngModel)]="favoriateColor"`），那么控件中的值（此例中为`favoriateColor`）也会在`ngModelChange`中被改变。

#### 从模型到视图

在[`setUpViewChangePipeline`](####从模型到视图)中，模型的变更所引起的操作除了包含向视图中写入值(`valueAccessor.writeValue`)，同时也会更新`ngModel`的值(`dir.viewToModelUpdate`)。

由此我们可以看到，无论响应式表单和模板驱动表单，模型与视图之间的交互都是`FormControl`与`ControlValueAccessor`完成的。不同的地方在于，响应式表单直接暴露了`FormControl`实例作为输入属性控，而模板驱动表单则使用自己创建的`FormControl`实例同时控制`ngModel`和视图。因此在以上的两个流程中模板驱动表单总会比响应式表单多一个额外的步骤——更新`ngModel`，而更重要的是在`NgModel._updateValue`这个方法中我们发现变更模型其实是一个异步操作。而且如果采用了双向绑定，那么便无法追踪具有唯一性的变更，因为`formControl.registerOnChange`所注册的变更响应函数和`ngModelChange`都会触发。简而言之，模板驱动表单的副作用实在太多了，比起它来同步的、不可变的响应式表单才更符合Angular的响应式编程模式。

下面的图示以`NgModel`为例表明了在模板驱动式表单中的数据流动情况。

![模板驱动式表单](http://assets.processon.com/chart_image/5e0876c1e4b0125e2926a9d7.png)
