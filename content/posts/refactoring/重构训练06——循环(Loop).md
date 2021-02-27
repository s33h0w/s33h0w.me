---
title: 重构训练06——循环(Loop)
date: 2020-08-21 23:23:23
tags: 重构
---
拆分循环让循环保持专一，尽量使用以管道取代循环，增强代码的可读性。
<!--more-->

## Problem

```typescript
type Employee = {
  id: string;
  job: "programmer" | "other";
  salary: number;
};

function getTotalSalaryAndProgrammerSalary(
  employees: Employee[]
): {
  totalSalary: number;
  programmerSalary: number;
} {
  let totalSalary = 0;
  let programmerSalary = 0;

  for (const e of employees) {
    if (e.job === "programmer") {
      programmerSalary += e.salary;
    }
    totalSalary += e.salary;
  }

  return {
    totalSalary,
    programmerSalary
  };
}

const employees = [
  {
    id: "123",
    job: "programmer",
    salary: 5
  },
  {
    id: "234",
    job: "other",
    salary: 7
  },
  {
    id: "345",
    job: "programmer",
    salary: 9
  }
];
console.log(getTotalSalaryAndProgrammerSalary(employees));
// {totalSalary: 21, programmerSalary: 14}

```

## Solution

```typescript
type Employee = {
  id: string;
  job: "programmer" | "other";
  salary: number;
};

function sumSalary(employees: Employee[]): number {
  return employees.map((it) => it.salary).reduce((acc, item) => acc + item, 0);
}

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
const employees = [
  {
    id: "123",
    job: "programmer",
    salary: 5
  },
  {
    id: "234",
    job: "other",
    salary: 7
  },
  {
    id: "345",
    job: "programmer",
    salary: 9
  }
];
console.log(getTotalSalaryAndProgrammerSalary(employees));
// 21, 14

```

## 总结

如果循环做了太多事情，我们可以使用**拆分循环 Split Loop**来让循环保持专一。虽然拆分循环看起来让循环的次数增多了，但更有利于我们捕捉更深层次优化的可能。如果确实成为了性能瓶颈，再合回去也容易得多。

循环语句已经过时了，管道操作能更好处理迭代过程，使用**以管道取代循环 Replace Loop with Pipeline**能让代码可读性更强。

1. 循环中做了两件事，将它们拆分为`getTotalSalary`和`getProgrammerSalary`两个过程 => **拆分循环**，**提炼函数**
2. 使用管道操作取代循环语句 => **以管道取代循环**
3. 提炼计算 salary 的重复代码至`sumSalary` => **提炼函数**
4. `getTotalSalary`和`getProgrammerSalary`不再有意义，内联至`getTotalSalaryAndProgrammerSalary`中 => **内联函数**
