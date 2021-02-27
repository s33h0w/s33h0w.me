---
title: 重构训练03——基本类型偏执(Primitive-Obsession)
date: 2020-07-28 23:23:23
tags: 重构
---
当基本类型（往往是字符串）不足以承载数据的信息时，我们应该创建一个“对自己的问题域有用的基本类型“。
<!--more-->

## 对某种基本类型数据的操作过于复杂

## Problem

```typescript
const phoneNumbers = ['+86 13123456789', '+1 2223334444', '+81 7012345678', '+852 61234567'];
function isChinaPhoneNumber(phone: string): boolean {
  return phone.startsWith('086');
};

function formatPhoneNumber(phone: string): string {
  const areaCode = phone.split(' ')[0].slice(1);
  const value = phone.split(' ')[1];

  return areaCode.padStart(3,'0') + value;
};

console.log(phoneNumbers.map(formatPhoneNumber).filter(isChinaPhoneNumber));
// ['08613123456789']
```

## Solution

```typescript
class PhoneNumber {
  private _areaCode: string;
  private _value: string;

  static readonly AreaCode = {
    China: '086',
    America: '001',
    Japan: '081',
    HongKong: '852'
  };

  constructor(areaCode: string, value: string) {
    this._areaCode = areaCode;
    this._value = value;
  }

  get areaCode() {
    return this._areaCode.padStart(3,'0');
  }
  get phoneNumber() {
    return this.areaCode + this._value;
  }

  static areaCode(area: string) {
    return PhoneNumber.AreaCode[area]
  }
}

const phoneNumbers: PhoneNumber[] = ['+86 13123456789', '+1 2223334444', '+81 7012345678', '+852 61234567'].map(p => {
  const area = p.split(' ')[0].slice(1);
  const value = p.split(' ')[1];
  return new PhoneNumber(area, value)
})

function isChinaPhoneNumber(phone: Phonenumber): string {
  return phone.areaCode===PhoneNumber.areaCode('China')
}

console.log(phoneNumbers.filter(isChinaPhoneNumber).map(p => p.phoneNumber))
```

## 总结

当基本类型（往往是字符串）不足以承载数据的信息时，我们应该创建一个“对自己的问题域有用的基本类型”，去处理诸如电话号码、钱、坐标等等这样的信息。

“你可以运用**以对象取代基本类型**将原本单独存在的数据值替换为对象，从而走出传统的洞窟，进入炙手可热的对象世界。”

1. 用 PhoneNumber 类取代原来的字符串来处理这种数据 => **以对象取代基本类型  Replace Primitive with Object**

2. 将`086`和`areaCode`等特殊信息提取至 PhoneNumber 类中 => **提炼类 Extract Class**

3. 将函数中对 phoneNumber 字符串的引用替换为对 PhoneNumber 对象的引用
