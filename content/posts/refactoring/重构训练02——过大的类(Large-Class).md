---
title: 重构训练02——过大的类(Large-Class)
date: 2020-07-21 23:23:23
tags: 重构
---
“如果想利用单个类做太多事情，其内往往就会出现太多字段。一旦如此，重复代码也就接踵而至了。”
<!--more-->

## 某些类成员联系十分紧密

### Problem

```typescript
class Person {
  name: string;
  officeAreaCode: number;
  officeNumber: number;

  getTelephoneNumber() {
    return this.officeAreaCode.toString() + this.officeNumber.toString();
  }
}
```

### Solution

```typescript
class Person {
  name: string;
	telephoneNumber: TelephoneNumber;

  getTelephoneNumber() {
    return this.telephoneNumber.toString();
  }
}

class TelephoneNumber {
  areaCode: number;
  number: number;

  toString() {
    return this.areaCode.toString() + this.officeNumber.toString();
  }
}
```

”通常，如果类内的数个变量有着相同的前缀或后缀，这就意味着有机会把它们提炼到某个组件内。“

1. 根据多次出现的前缀`office`提炼出`TelephoneNumber` => **Extract Class 提炼类**

## 类的功能只适用于特定情形

### Problem

```typescript
class Employee {
  name: string;
  type: "programmer"|"salesman"|"manager";

  private writeCode() {}
  private sales() {}
  private talking() {}
  work() {
    switch(this.type) {
      case "programmer":
        this.writeCode();
        break;
      case "salesman":
        this.sales();
        break;
      case "manager":
        this.talking();
        break;
    }
  }
}
```

### Solution

```typescript
class Employee {
  name: string;
  type: "programmer"|"salesman"|"manager";

  abstract work() {}
}

class Programmer extends Employee {
  work(){
    this.writeCode()
  }
  private writeCode() {}
}

class Salesman extends Employee {
  work() {
    this.sales()
  }
  private sales() {}
}

class Manager extends Employee {
  work() {
    this.talking()
  }
  private talking() {}
}
```

如果一个类的部分功能只适用于特定情形，可以根据这些情形将它分割为不同的子类。

1. 根据`employee.type`将其分为不同的子类 => **Extract Subclass 提炼子类** （新版重构参见 Replace Type Code with Subclasses）

## 两个类在做相似的事情

### Problem

```typescript
class Programmer {
  name: string;
  gender: "MALE"|"FEMALE";
  monthlyCost: number;

  get annualCost() {
    return this.monthlyCost * 12;
  }
  work() {
    this.writeCode()
  }
  private writeCode() {}
}

class Salesman {
  name: string;
  gender: "MALE"|"FEMALE";
  monthlyCost: number;

  get annualCost() {
    return this.monthlyCost * 12;
  }
  work() {
    this.sales()
  }
  private sales() {}
}
```

### Solution

```typescript
class Employee {
  name: string;
  gender: "MALE"|"FEMALE";
  monthlyCost: number;

  get annualCost() {
    return this.monthlyCost * 12;
  }
  abstract work() {}
}

class Programmer extends Employee {
  work(){
    this.writeCode()
  }
  private writeCode() {}
}

class Salesman extends Employee {
  work() {
    this.sales()
  }
  private sales() {}
}
```

”如果我看见有两个类在做相似的事，可以利用基本的继承机制把它们的相似之处提炼到超类。“

1. `Programmer`和`Salesman`的`name`,`gender`,`monthlyCost`,`annualCost`,`work`都是相似的，将它们提炼到超类`Employee`中 => **Extract Superclass 提炼超类**
