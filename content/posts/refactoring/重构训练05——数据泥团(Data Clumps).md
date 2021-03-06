---
title: 重构训练05——数据泥团(Data-Clumps)
date: 2020-08-14 23:23:23
tags: 重构
---

数据泥团这种情况往往需要多种处理方法才能把杂乱的数据放在合适的位置上，建议按照先处理对象再处理函数的顺序来思考。

<!--more-->

## Problem

```typescript
type Product = {
  id: string
  value: number
}

class Cart {
  productList: Product[] = []
  productQuantityList: number[] = []
  selected: Product[] = []

  constructor(
    list: {
      product: Product
      quantity: number
    }[]
  ) {
    list.forEach(item => {
      this.productList.push(item.product)
      this.productQuantityList.push(item.quantity)
    })
  }

  check(id: string): void {
    const checkedProduct = this.productList.find(p => p.id === id)
    checkedProduct && this.selected.push(checkedProduct)
  }

  uncheck(id: string): void {
    this.selected = this.selected.filter(p => p.id !== id)
  }

  checkAll(): void {
    this.selected = this.productList
  }

  getTotal(): number {
    return this.productList.reduce((total, item, idx) => {
      if (!this.selected.find(p => p.id === item.id)) {
        return total
      }
      const itemQuantity = this.productQuantityList[idx]
      const itemPrice = item.value * itemQuantity
      return total + itemPrice
    }, 0)
  }
}
```

## Solution

```typescript
class Cart {
  cartItemList: CartItem[]

  constructor(list: CartItem) {
    this.cartItemList = list
  }

  check(item: CartItem) {
    item.check()
  }

  unCheck(item: CartItem) {
    item.unCheck()
  }

  checkAll() {
    this.cartItemList.map(item => item.check())
  }

  getTotal() {
    return this.cartItemList.reduce((total, item) => {
      return total + item.price
    }, 0)
  }
}

class CartItem {
  product: Product
  quantity: number
  private _checked: boolean = false

  constructor(product: Product, quantity: number) {
    this.product = product
    this.quantity = quantity
  }

  get price() {
    if (!this._checked) {
      return 0
    }
    return this.product.value * this.quantity
  }

  check() {
    this._checked = true
  }

  unCheck() {
    this._checked = false
  }
}
```

## 总结

当你发现函数参数或者类成员数量庞大时，很可能就有**数据泥团**的味道掺杂其中。

1. 找出那些密不可分的成员，它们应该拥有自己的对象 => **提炼类 Extract Class**
2. 将注意力转移到函数签名上，缩短参数列表，简化函数调用 => **引入参数对象 Introduce Parameter Object**，**保持对象完整 Preserve Whole Object**
