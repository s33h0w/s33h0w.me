---
title: 重构训练08——神秘命名(Mysterious-Name)
date: 2020-08-29 23:23:23
tags: 重构
---

“命名是编程中最难的两件事之一。” 强大的巫师可以准确叫出事物的正确名字。

<!--more-->

## Problem

```typescript
type RoomData = {
  roomType: 1 | 2 | 3 | 4
}

// Get the sum of bedroom and bathroom.
function theNumber(roomArray: RoomData[]): number {
  const r2 = roomArray.filter(r => r.roomType === 2).length
  const r3 = roomArray.filter(r => r.roomType === 3).length

  return r2 + r3
}
```

## Solution

```typescript
enum RoomType {
  Exterior,
  Bedroom,
  Bathroom,
  Other,
}
type Room = {
  type: RoomType
}

function getSumOfBedroomAndBathroom(rooms: Room[]): number {
  const bedroomNum = rooms.filter(r => r.type === RoomType.Bedroom).length
  const bathroomNum = rooms.filter(r => r.type === RoomType.Bathroom).length

  return bedroomNum + bathroomNum
}
```

## 总结

如何命名可以参考以下几个标准：

- **名副其实**：直接把名字丢给同事他就能准确的告诉你它是干什么用的。Renaming: theNumber => getSumOfBedroomAndBathroom, r2 => bedroomNum, r3 => bathroomNum
- **有意义的区分**：info, data 这类词语不能带来任何信息，不要用 RoomData 来表示一个和 Room 不同的数据。Renaming: RoomData => Room
- **可读、可搜索**：命名越接近人类语言，越容易被阅读。Renaming: 2 => RoomType.Bedroom, 3=> RoomType.Bathroom
- **避免编码**：如 userClass, LoginPageComponent，将类型和作用域写在命名里是画蛇添足。Renaming: roomArray => rooms
- **对象名应该是名词或名词短语**：Renaming: r2 => bedroomNum, r3 => bathroomNum
- **方法名应该是动词或动词短语**：Renaming: theNumber => getSumOfBedroomAndBathroom
- **上下文信息**：如果有必要，前缀或者后缀可以提供有意义的语境，帮助我们理解（例如 RoomType）。但不要添加没有必要的语境信息。 Renaming: roomType => type
- **其他**：有的时候起个好的名字并不容易，“有一个改进函数名字的好办法：先写一句注释描述这个函数的用途，再把这句注释变成函数的名字。Renaming: ” // Get the sum of bedroom and bathroom. => getSumOfBedroomAndBathroom
