---
title: 重构训练10——注释(Comments)
date: 2020-09-06 15:00:00
tags: 重构
---

如果可以，我们应该尽量不写注释。原因很简单——程序员不能坚持维护注释。

<!--more-->

## 注释往往是代码需要重构的征兆

“别给糟糕的代码加注释——重新写吧！”

### Problem1

```typescript
// if it's not summer, use the winter rate
if (date.before(SUMMER_START) || date.after(SUMMER_END)) {
  charge = quantity * winterRate;
}
else {
  charge = quantity * summerRate;
}
```

### Solution1

如果你需要注释来解释一段代码做了什么，试试提炼函数。

```typescript
function isSummer(date): boolean {
  return date.after(SUMMER_START) && date.before(SUMMER_END)
}

...

if (isSummer(date)) {
  charge = quantity * winterRate;
}
else {
  charge = quantity * summerRate;
}
```

### Problem2

```typescript
// get the sum of bedroom and bathroom
function theNumber(rooms: Room[]): number {
  const bedroomNum = rooms.filter((r) => r.roomType === 'bedroom').length;
  const bathroomNum = rooms.filter((r) => r.roomType === 'bathroom').length;

  return bedroomNum + bathroomNum;
}
```

### Solution2

如果函数仍需要注释来解释其做了什么，试试改变函数声明。

```typescript
function getSumOfBedroomAndBathroom(rooms: Room[]): number {
  ...
}
```

### 总结

好的代码可以自解释，而糟糕的代码往往需要注释的帮助。因此当你觉得要用注释去帮助解释函数做了什么的时候，请先尝试重构。顺着注释我们可以找到一些代码的坏味道，消除这些坏味道然后再考虑注释是否值得保留。

## 大多数注释只是画蛇添足

```typescript
/**
 * @author s33h0w
 * @date 2020-09-06 22:00
 */

type Employee = {
  id: string;
  job: "programmer" | "other";
  salary: number;
};

// function getTotalSalary(employees: Employee[]): number {
//  return employees.map((it) => it.salary).reduce((acc, item) => acc + item, 0);
// }

// get sum of the employees' salary
function sumSalary(employees: Employee[]): number {
  return employees.map((it) => it.salary).reduce((acc, item) => acc + item, 0);
}

/**
 * get total salary and programmer's salary
 *
 * @param {Employee[]} employees
 * @returns {{
 *   totalSalary: number;
 *   programmerSalary: number;
 * }}
 */
function getTotalSalaryAndProgrammerSalary(
  employees: Employee[]
): {
  totalSalary: number;
  programmerSalary: number;
} {
  const totalSalary = sumSalary(employees);
  const programmerSalary = sumSalary(
    employees.filter((it) => it.job === "programmer")
  );

  return {
    totalSalary,
    programmerSalary
  };
}
```

以上注释我按照位置编号为 Comment1, Comment2, Comment3 和 Comment4，虽然样貌不同，但它们都一样多余。

Comment1——日志式注释：忘了它吧，现在我们有 git。

Comment2——注释掉的代码：这是我最害怕的注释，因为没人敢告诉我它是否能被删除。所以如果代码没有用，就立刻删除它。不用担心会丢掉，毕竟你的代码北极都有。

Comment3——废话注释：`sumSalary`这个函数名早已说明一切，这个注释只是再重复一遍而已，它没有告诉我们任何其它的信息。

Comment4——循规蹈矩的注释：如果我们不是在撰写一些类似公共 API 这类东西，仅仅是某个内部调用的函数是无需这种注释的。这种注释的初衷大多是为了方便 IDE 解析文档或为一些开放接口提供更多的上下文信息。如果只是为了让代码看起来更“正规”，大可不必这样做。我自己的习惯是仅仅为那些被其他模块（文件）调用的函数添加这种注释，毕竟维护它的代价不小。

## 好注释

以上都是坏注释的案例，但这并不是说我们不该用注释。好的注释非常有用，下面介绍一些常见的好注释。

- 法律信息：例如版权及著作声明等等。
- 提供必要信息：比如关于代码中一些特殊值的含义，有助于理解的上下文信息，警示信息，设计时的关键决策等等
- TODO 注释：好的 TODO 注释的格式是：`TODO(name): description`
- 公共 API 中的文档型注释：良好的描述对所有人都是一种帮助

## 总结

好的注释帮助巨大，坏注释破坏巨大。注释不能美化糟糕的代码，只有代码本身不足以表达所有必要信息时，我们才需要注释。如果可以，我们应该尽量不写注释。原因很简单——程序员不能坚持维护注释。
