---
title: 重构训练01——过长函数(Long-Method)
date: 2020-07-07 23:23:23
tags: 重构
---

“据我们的经验，活得最长、最好的程序，其中的函数都比较短。”

<!--more-->

## 函数需要用注释来说明点什么

### Problem

```typescript
function printOwing(invoice: Invoice): void {
  // print banner
  console.log('***********************')
  console.log('**** Customer Owes ****')
  console.log('***********************')

  // record due date
  const today = Clock.today
  invoice.dueDate = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() + 30
  )
}
```

### Solution: Extract Function 提炼函数

```typescript
function printOwing(invoice: Invoice): void {
  printBanner()
  recordDueDate(invoice)
}

function printBanner(): void {
  console.log('***********************')
  console.log('**** Customer Owes ****')
  console.log('***********************')
}

function recordDueDate(invoice: Invoice): void {
  const today = Clock.today
  invoice.dueDate = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() + 30
  )
}
```

### 总结

(判断是否提炼)“关键不在于函数的长度，而在于函数“做什么”和“如何做”之间的语义距离。如何确定该提炼哪一段代码呢？一个很好的技巧是：寻找注释。”

1. 根据注释`print banner`，提炼出 `printBanner()` => **Extract Function 提炼函数**
2. 根据注释`record due date`，提炼出`recordDueDate()` => **Extract Function 提炼函数**

## 有大量的本地变量和参数妨碍提炼函数

### 临时变量

#### Problem

```typescript
function calculateTotal(): number {
  let basePrice = quantity * itemPrice
  if (basePrice > 1000) {
    return basePrice * 0.95
  } else {
    return basePrice * 0.98
  }
}
```

#### Solution: Replace Temp with Query 以查询取代临时变量

```typescript
function calculateTotal(): number {
  if (basePrice() > 1000) {
    return basePrice() * 0.95
  } else {
    return basePrice() * 0.98
  }
}
function basePrice(): number {
  return quantity * itemPrice
}
```

### 参数总是成对出现

#### Problem

```typescript
function amountInvoiced(startDate, endDate) {...}
function amountReceived(startDate, endDate) {...}
function amountOverdue(startDate, endDate) {...}
```

#### Solution: Introduce Parameter Object 引入参数对象

```typescript
function amountInvoiced(aDateRange) {...}
function amountReceived(aDateRange) {...}
function amountOverdue(aDateRange) {...}
```

### 参数中分别引入了某个对象的多个属性

#### Problem

```typescript
let low = daysTempRange.getLow()
let high = daysTempRange.getHigh()
let withinPlan = plan.withinRange(low, high)
```

#### Solution: Preserve Whole Object 保持对象完整

```typescript
let withinPlan = plan.withinRange(daysTempRange)
```

### 总结

如果函数内有大量的参数和临时变量，对你提炼函数造成阻碍，使用：**Replace Temp with Query 以查询取代临时变量**，**Introduce Parameter Object 引入参数对象**，**Preserve Whole Object 保持对象完整**。

## 函数中出现了条件表达式和循环

### 复杂的条件表达式

#### Problem

```typescript
if (date.before(SUMMER_START) || date.after(SUMMER_END)) {
  charge = quantity * winterRate + winterServiceCharge
} else {
  charge = quantity * summerRate
}
```

#### Solution: Decompose Conditional 分解条件表达式

```typescript
if (isSummer(date)) {
  charge = summerCharge(quantity)
} else {
  charge = winterCharge(quantity)
}
```

### 循环

#### Problem

```typescript
function calculateOutstanding(invoice: Invoice): number {
  let result = 0
  for (const o of invoice.orders) {
    result += o.amount
  }
  return result
}
```

#### Solution: Extract Function 提炼函数，Split Loop 拆分循环，Replace Loop with Pipeline 以管道取代循环

```typescript
function calculateOutstanding(invoice: Invoice): number {
  const reducer = (accumulator: number, currentValue: number) =>
    accumulator + currentValue
  return invoice.orders.reduce(reducer, 0)
}
```

### 总结

“条件表达式和循环也常常是提炼的信号。”

1. 根据条件表达式`date.before(SUMMER_START) || date.after(SUMMER_END)`，提炼函数`isSummer(date)` => **Decompose Conditional 分解条件表达式**
2. 根据循环进行提炼函数`calculateOutstanding` => **Extract Function 提炼函数**
3. 如果循环中存在多个逻辑，需要拆分 => **Split Loop 拆分循环**
4. 关于循环的处理还可以更加精进，使用管道代替循环可以使代码更简洁可读性更高 => **Replace Loop with Pipeline 以管道取代循环**
