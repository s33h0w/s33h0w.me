---
title: 重构训练04——过长的参数列表(Long-Parameter-List)
date: 2020-08-07 23:23:23
tags: 重构
---

“函数的参数列表应该总结函数的可变性“，尽可能找到真正匹配函数作用的参数。

<!--more-->

## 可以发起查询去获得某个参数的值

## Problem

```typescript
type Employee = {
  id: string
  gender: 'female' | 'male'
  grade: 'junior' | 'senior'
}

function usedVacation(id: string): number {
  // 假设这里进行了一些计算
  return 2
}

function availableVacation(
  gender: 'female' | 'male',
  grade: 'junior' | 'senior',
  used: number
): number {
  const base = gender === 'female' ? 5 : 3
  const rate = grade === 'junior' ? 1 : 2

  return base * rate - used
}

const wangmei = {
  id: '123123',
  gender: 'female',
  grade: 'senior',
}

const used = usedVacation(wangmei.id)

console.log(availableVacation(wangmei.gender, wangmei.grade, used))
// 8
```

## Solution

```typescript
// ...
function availableVacation(employee: Employee): number {
  const base = employee.gender === 'female' ? 5 : 3
  const rate = employee.grade === 'junior' ? 1 : 2
  const used = usedVacation(employee.id)

  return base * rate - used
}
```

## 总结

“函数的参数列表应该总结函数的可变性”

“参数列表越短，函数越容易理解”。如果函数某个参数的值，由函数自己来获得也是**同样容易**，那么就可以使用**以查询取代参数**来移除这个参数。

1. 将参数列表中`Employee`的属性`gender`和`grade`替换为`Employee`对象=> **保持对象完整 Preserve Whole Object**
2. 将`used`参数替换为函数内部的查询语句 => **以查询取代参数 Replace Parameter with Query**
