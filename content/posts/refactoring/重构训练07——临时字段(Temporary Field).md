---
title: 重构训练07——临时字段(Temporary-Field)
date: 2020-08-28 23:23:23
tags: 重构
---
如果某个字段依赖于某种特殊情况，我们可以使用引入特例，将临时字段和这种特殊情况提取出来。
<!--more-->

## Problem

```typescript
class Customer {
  name: string;
  isVIP: boolean;
  private _gift: Gift;

  constructor(name: string, isVIP: boolean, gift: Gift) {
    this.name = name;
    this.isVIP = isVIP;
    this._gift = gift;
  }

  get discount(): number {
    if (this.isVIP) {
      return 0.8;
    }

    return 1;
  }

  get birthdaySurperise(): Gift | null {
    if (this.isVIP) {
      return this._gift;
    }

    return null;
  }
}

```

## Solution

```typescript
class Customer {
  name: string;

  constructor(name: string) {
    this.name = name;
  }

  get isVIP(): boolean {
    return false;
  }

  get discount(): number {
    return 1;
  }

  get birthdaySurperise(): null {
    return null;
  }
}

class VIPCustomer {
  name: string;
  gift: Gift;

  constructor(name: string, gift: Gift) {
    this.name = name;
    this.gift = gift;
  }

  get isVIP(): boolean {
    return true;
  }

  get discount(): number {
    return 0.8;
  }

  get birthdaySurperise(): Gift {
    return this.gift;
  }
}
```

## 总结

有的时候我们会发现，某个字段仅仅在特殊情况下才有意义。那么日积月累之后我们对这个字段就需要小心翼翼，可能对象已经不再出现这种特殊情形，但我们仍然不敢删除这个字段。毕竟谁会一直记得一个字段依赖于哪种情形呢？

针对这种情况我们可以使用**引入特例**，将临时字段和这种特殊情况提取出来，从而避免那些重复的条件代码。

1. 字段`gift`只有在`isVIP===true`的情况下才有意义，`discount`和`birthdaySurperise`中都需要判断`isVIP`，需要引入特例`VIPCustomer` => **引入特例 Introduce Special Case**
2. 将字段`gift`移至`VIPCustomer`中，改写`isVIP`相关函数 => **搬移字段 Field**，**搬移函数 Move Function**
