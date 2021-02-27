---
title: 重构训练11——夸夸其谈通用性(Speculative Generality)
date: 2020-09-13 16:00
tags: 重构
---

当有人说“噢，我想我们总有一天需要做这件事”，并因而企图以各式各样的钩子和特殊情况来处理一些非必要的事情，这种坏味道就出现了。

<!--more-->

假设有个需求要求我们限制`batchGetRoomType`这个 batch request 的最大请求数量，然后将超出限制的批请求均匀分成几个小的请求。下面是我当时的设计，我利用 lodash 提供的 chunk 函数将请求拆分，并且为了让这个函数更加通用，添加了 `threshold`参数，然后把它移到了 utils 目录下。同时为 `batchRequest`添加`threshold`参数，好让它能适应不同请求阈值的情况。

```typescript
// src/utils
// Divide resources into average chunks based on maximum threshold
export function getAvarageChunksByThreshold<T>(source: T[], threshold: number): T[][] {
  const chunkNum = Math.ceil(source.length / threshold);
  const chunkSize = Math.ceil(source.length / chunkNum);
  
  return chunk<T>(source, chunkSize)
}

// src/app.ts
// 每个 batch request 的最大请求数量
const BATCH_GET_ROOM_TYPE_MAX_NUMBER = 50;

async function getBatchGetRoomType(urls: string[], threshold = BATCH_GET_ROOM_TYPE_MAX_NUMBER): Promise<RoomType[]> {
  const requests =  getAvarageChunksByThreshold(urls, threshold).map(batchGetRoomType)
  
  return await Promise.all(requests)
}
```

当我们面向未来进行设计时，应该时刻提醒自己**夸夸其谈通用性**这种坏味道。让我们先来看看[《重构》](https://book.douban.com/subject/30468597/) 中对它的定义：

> 当有人说“噢，我想我们总有一天需要做这件事”，并因而企图以各式各样的钩子和特殊情况来处理一些非必要的事情，这种坏味道就出现了。

示例代码就是这种坏味道的典型场景。整个设计其实都是围绕`threshold`做的变动，试图让它更加通用，以满足未来某天多个阈值的需求。然而令人遗憾的是，直到现在我也没有遇到`batchGetRoomType`存在多个请求阈值的情况。事实上，限制最大请求数量这个需求只针对于`batchGetRoomType`，因此我们可以这样改写函数。

```typescript
// src/app.ts
// 每个 batch request 的最大请求数量
const BATCH_GET_ROOM_TYPE_MAX_NUMBER = 50;

function getAvarageUrlChunks(urls: string[]): srting[][] {
  const chunkNum = Math.ceil(urls.length / BATCH_GET_ROOM_TYPE_MAX_NUMBER);
  const chunkSize = Math.ceil(urls.length / chunkNum);
  
  return chunk(urls, chunkSize)
}

async function getBatchGetRoomType(urls: string[]): Promise<RoomType[]> {
  const requests =  getAvarageUrlChunks(urls).map(batchGetRoomType)
  
  return await Promise.all(requests)
}
```

通过移除`threshold`参数，缩小了函数的适用范围，使它只针对`batchGetRoomType`。现在我不必维护原来针对于`getAvarageChunksByThreshold`的单元测试，也不会使别人在调用`getBatchGetRoomType`时需要了解 `threshold`的作用。更重要的是，如果有一天真的出现了多个阈值的需求，我可以那时再为函数添加`threshold`参数，所花费的功夫也不会比之前多。

或许有人会对此疑惑，因为我们总是被教导写代码要有一定的前瞻性。对此我的理解是，如果我们确定以后会被用到，那就可以；如果只是猜测，那就不值得。编程时如需面向未来，可以用奥卡姆剃刀来检验我们的设计，挑选其中实现方法最简单的。**简单而专一胜过复杂但通用。**

