---
title: 重构训练12——发散式变化(Divergent Change)
date: 2020-10-04 20:00:00
tags: 重构
---

每当要对某处做修改时，需要在多个上下文环境进行修改，发散式变化坏味道就出现了。

<!--more-->

### Problem

假设一个场景，customer 和 agent 都需要获取 listing 的更新时间，而且 agent 还能修改更新时间。目前 listing 的时间为 UTC 时间，customer 和 agent 在读写时需要根据自身的 timezone 转化为本地时间，代码如下。我们将关注点放在对 listing 更新时间的处理上。请问这样的设计有没有问题？

```typescript
import {set} from 'lodash';
import {format, parse} from 'date-fns';
import {utcToZonedTime, zonedTimeToUtc} from 'date-fns-tz';

interface Lisiting {
  date: {
    updated: number;
  }
}

class Customer {
  timezone: string;

  getListingUpdatedDate(listing: Listing): string {
    const date = new Date(listing.date.updated);
    const utcDate = utcToZonedTime(date, this.timezone)

    return formatDate(utcDate);
  }
}

class Agent {
  timezone: string;

  getListingUpdatedDate(listing: Listing): string {
    const date = new Date(listing.date.updated);
    const utcDate = utcToZonedTime(date, timezone)

    return formatDate(utcDate);
  }

	setListingUpdatedDate(listing: Listing, dateString: string): void {
    const date = parseDate(dateString);
    const utcDate = zonedTimeToUtc(new Date(date), timezone)

    const newListing = set({...listing}, ['date', 'updated'], utcDate)
    // assuming it's an api call
    updateListing(newListing)
  }
}

// e.g. => '02/23/2020'
function formatDate(date: Date): string {
  return format(date, 'MM/dd/yyyy')
}

function parseDate(dateString: string): Date {
  return parse(dateString, 'MM/dd/yyyy', new Date())
}
```

### Solution

有些坏味道单看代码可能不易察觉，只有当它们受到挑战时才显露其脆弱。我们试着挑战一下这些代码。假设listing 的数据结构发生了变化，现在 listing.updated 代表 listing 的更新时间。以上代码需要做怎样的改动呢？或者假如 listing.updated 没有使用 UTC 时间，而是根据 listing.location.timezone 进行转化后的本地时间。customer 和 agent 想要读写正确的时间的话，代码又该如何变动呢？

如果亲自去实现以上需求就会发现，为了适应 listing更新时间的变动，我们需要在不止一个地方进行对应的调整。目前是 Customer 和 Agent ，如果有其他地方也有类似的调用，无疑也需要一一更改。这就是**发散式变化**的坏味道——每当要对某处做修改时，需要在多个上下文环境进行修改。

解决方法在于维护一个纯净的上下文环境，使我们“每次只关心一个上下文”。比如 Customer 这个类，本身是 customer 的上下文，却需要关心 listing 的更新时间是如何被处理的。我们可以通过提炼函数，搬移函数，提炼类等等方法使 Customer 再次变得纯净。

```typescript
// client.ts
import {getListingUpdatedDate, setListingUpdatedDate} from '@utils/listing-updated'

class Customer {
  timezone: string;
}

// customer get listing updated date
getListingUpdatedDate(listing, customer.timezone)

class Agent {
  timezone: string;
}

// agent get listing updated date
getListingUpdatedDate(listing, agent.timezone)

// agent set listing updated date
setListingUpdatedDate(listing, dateString, agent.timezone)

// utils/listing-updated.ts

import {set} from 'lodash';
import {format, parse} from 'date-fns';
import {utcToZonedTime, zonedTimeToUtc} from 'date-fns-tz';

interface Listing {
  date: {
    updated: number;
  }
}

export function getListingUpdatedDate(listing: Listing, timezone: string): string {
  const date = new Date(listing.date.updated);
  const utcDate = utcToZonedTime(date, timezone)

  return formatDate(utcDate);
}

export function setListingUpdatedDate(listing: Listing, dateString: string, timezone: string): void {
  const date = parseDate(dateString);
	const utcDate = zonedTimeToUtc(new Date(date), timezone)

	const newListing = set({...listing}, ['date', 'updated'], utcDate)
	// assuming it's an api call
	updateListing(newListing)
}

// e.g. => '02/23/2020'
function formatDate(date: Date): string {
  return format(date, 'MM/dd/yyyy')
}

function parseDate(dateString: string): Date {
  return parse(dateString, 'MM/dd/yyyy', new Date())
}
```

在这里我移除了 Customer 和 Agent 中关于 listing 更新时间的处理，将它们移入到了 listing-updated 模块。（当然你也可以创建 Listing 类，然后将这些方法作为 Listing 类的方法。由于前端的处理中不会变化 listing 数据，这里选择了更函数式的做法。）现在所有有关 listing 更新时间的变更都只需在 listing-updated 中完成。

### 总结

**发散式变化**经常是由于我们简单地复制粘贴代码导致的。这些代码起初属于某个上下文，后来被粘贴到了不同的地方。因此每当这个上下文发生变动时就会有许多地方同时需要被改变。解决方法在于通过提炼函数、搬移函数、提炼类等手段将分散的代码提炼至属于自己的上下文环境。
