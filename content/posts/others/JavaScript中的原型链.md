---
title: JavaScript中的原型链
date: 2019-03-11 20:00:16
tags:
- javascript
---

JavaScript 是一种基于原型(prototype-based)的面向对象语言。在 JavaScript 中，每一个实例对象都有一个与之相关联的原型链，通过原型链与继承关系，JavaScript 定义了对象的属性。
<!--more-->
## 原型链

每个实例对象都有一个私有属性(`__proto__`)指向它的原型(`prototype`)，该原型也有自己的原型，如此不断向上就会形成一个原型链。原型链的终点为`null`，`null`不存在原型。在控制台中运行代码可以看到如下日志，其中`o.__proto__`就指向对象`o`的原型。

```js
var o = { a: 1 }

console.log(o) // { a: 1, __proto__: Object}
```

> 遵循 ECMAScript 标准，`someObject.[[Prototype]]`符号是用于指向`someObject`的原型。从 ECMAScript 6 开始，`[[Prototype]]`可以通过`Object.getPrototypeOf()`和`Object.setPrototypeOf()`访问器来访问。这个等同于 JavaScript 的非标准但许多浏览器实现的属性 `__proto__`。

接下来我们使用`Object.create`以对象`o`为原型创建对象`p`。然后改变`o.a`的值,观察`p.a`的值的变化。

```js
var p = Object.create(o)
console.log(p.a) // 1
console.log(p.__proto__===o) // true
// 完整的原型链是：p ---> o ---> Object.prototype --->null,其中Object.prototype代表Object的原型对象
o.a = 2
console.log(p.a) // 2
// 由于p的属性a继承自o，改变o.a的值，p.a的值也会随之改变
```

现在我们以`p`为原型创建对象`q`，并重新赋值`p.a`。

```js
p.a = function () {
  this.x = 1
  this.y = 2
}
var q = Object.create(p)
console.log(q.__proto__===p) // true
// 完整的原型链是： q ---> p ---> o ---> Object.prototype ---> null
console.log(q.a) // f () { this.x = 1; this.y = 1 }
// q的属性a继承自原型链上的p
o.b = 3
console.log(q.b) // 3
// q的属性b继承自原型链上的o
console.log(o.c) // undefined
```

当访问`q`的某一属性的时候，如果`q`本身没有这个属性，就会在`q`的原型`p`中寻找有没有名称匹配的属性，如果有则返回该属性的值，如果没有则继续向上寻找`p`的原型`o`中有没有名称匹配的属性，如此向上追溯直至原型链的终点。

> When trying to access a property of an object, the property will not only be sought on the object but on the prototype of the object, the prototype of the prototype, and so on until either a property with a matching name is found or the end of the prototype chain is reached.

**在 JavaScript 中，任意一个对象都有一个与之相关联的原型链，试图访问该对象的某个属性时，除了对象本身之外，还会访问与其关联的原型链，直到找到名称匹配的第一个属性或者到达原型链的终点为止。**

## `prototype` 与 `__proto__`

上文已经提到，在原型链`q ---> p ---> o ---> Object.prototype ---> null`中, `Object.prototype`代表`Object`的原型对象。与对象的私有属性`__proto__`指向对象的原型不同，`prototype`是函数(`Function`)特有的属性。在控制台中运行如下代码:

```js
var f = function(x, y) {
    this.x = x
    this.y = y
}
console.log(f.prototype) // {constructor: f (x,y), __proto__: Object}
var o = new f(1,2)
console.log(o.__proto__===f.prototype) // true
console.log(f.prototype.__proto__===Object.prototype) // true
// 完整的原型链是：o ---> f.prototype ---> Object.prototype ---> null
```

原型链上的每一环均为对象，实例对象(`instance`)与原型对象(`prototype`)。实例对象处于原型链的下游，其源自原型对象，原型对象处于原型链的上游，原型链的顶端是`Object.prototype`。因此，在 JavaScript 中几乎所有的对象都是位于原型链顶端的`Object`构造函数构造的实例。

根据这一点，我们可以通过改变构造函数的`prototype`来改变实例的属性。

```js
f.prototype.z = function() {
  this.a = 'a'
  this.b = 'b'
}
console.log(o.z) // function() { this.a='a' this.b='b' }
```

可以说 JavaScript 中的所有对象均由函数以构造函数生成，都源自函数的原型对象。而函数本身其实也是一种对象(`Function`对象)，它们可以像对象一样具有属性和方法。因此经常说函数是 JavaScript 的头等公民(first-class object)。

## 参考文章

> [Inheritance and the prototype chain](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Inheritance_and_the_prototype_chain)
>
> [Details of the object model](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Details_of_the_Object_Model)
