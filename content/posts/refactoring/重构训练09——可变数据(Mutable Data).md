---
title: 重构训练09——可变数据(Mutable-Data)
date: 2020-08-30 23:23:23
tags: 重构
---

可变数据是一种非常常见，但是不易捕捉的坏味道。这里分成三种常见类型进行讨论。

<!--more-->

## Case 1

### Problem

```typescript
const initialMonths = ['Jan', 'March', 'April', 'June']

function getCompletedMonths(months: string[]): string {
  months.splice(1, 0, 'Feb')
  return months
}

console.log(getCompletedMonths(initialMonths))
// ["Jan", "Feb", "March", "April", "June"]
```

### Solution

```typescript
const initialMonths = ['Jan', 'March', 'April', 'June']

function getCompletedMonths(months: string[]): string {
  return [...months].splice(1, 0, 'Feb')
}

console.log(getCompletedMonths(initialMonths))
// ["Jan", "Feb", "March", "April", "June"]
```

总结

”任何有返回值的函数，都不应该有看得到的副作用“，比如改变函数的参数。如果需要更新一个数据结构，就返回一份新的数据副本，旧的数据仍保持不变。

## Case 2

### Problem

```typescript
// Sound the alarm and send a request to call the police.
function setOffAlarms() {}

function alertForMiscreant(people: string): void {
  const miscreant = people.find(
    p => p === 'Michael' || p === 'Trevor' || p === 'Franklin'
  )
  if (miscreant) {
    setOffAlarms()
  }
}
```

### Solution

```typescript
// Sound the alarm and send a request to call the police.
function setOffAlarms() {}

function findMiscreant(people: string[]): string | undefined {
  return people.find(p => p === 'Michael' || p === 'Trevor' || p === 'Franklin')
}

function alertForMiscreant(people: string[]): void {
  if (findMiscreant(people)) {
    setOffAlarms()
  }
}
```

### 总结

”如果函数仅仅是提供一个值，没有任何看得到的副作用，那么这是一个很有价值的东西。“ 尽可能从带有副作用的函数中将查询动作分离，使它更有价值，使用**将查询函数和修改函数分离（Separate Query from Modifier）**。

## Case 3

### Problem

[Online Demo](https://stackblitz.com/edit/refactoring-mutable-data?file=index.tsx)

```typescript
type Option = {
  label: string
  value: string
}

function MutiCheck(props: {options: Option[]}) {
  const {options} = props
  const [selectAll, setSelectAll] = useState(false)
  const [selected, setSelected] = useState<Option[]>([])

  const handleChange = (option: Option, checked: boolean): void => {
    const currentSelected = new Set(selected)
    if (checked) {
      currentSelected.add(option)
    } else {
      currentSelected.delete(option)
    }
    setSelected(Array.from(currentSelected))
    setSelectAll(options.every(o => currentSelected.has(o)))
  }

  return (
    <div>
      <input type="checkbox" checked={selectAll} readOnly /> Select All
      {options.map(o => (
        <label key={o.value}>
          <input
            type="checkbox"
            value={o.value}
            onChange={e => handleChange(o, e.target.checked)}
          />
          {o.label}
        </label>
      ))}
    </div>
  )
}
```

### Solution

```typescript
function MutiCheck(props:{options: Option[]}) {
  const {options} = props;
  const [selected, setSelected] = useState<Option[]>([]);

  const handleChange = (option: Option, checked: boolean): void => {
    const currentSelected = new Set(selected);
    if(checked) {
      currentSelected.add(option)
    } else {
      currentSelected.delete(option)
    }
    setSelected(Array.from(currentSelected));
  }

  const isSelectAll = () => {
    return options.every(opt => new Set(selected).has(opt))
  }

  ...
}
```

### 总结

如果可变数据的值能在其他地方计算出来（比如`selectAll`），这就是一个特别刺鼻的坏味道。消除这种坏味道的办法很简单，使用**以查询取代派生变量（Replace Derived Variable with Query）**。
