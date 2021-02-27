---
title: Angular项目如何组织一个良好的目录结构
date: 2019-11-16 16:05:49
tags:
- Angular
- 架构
---

良好的目录结构对于应用的重要性不必多说，下面我们会通过三个问题逐步探讨它应该是怎样的。（太长不看的同学可以直接跳至总结看最后的目录。）
<!-- markdownlint-disable MD036 -->
_注：这里的目录结构仅仅指的是app文件夹内的结构_
<!-- markdownlint-enable MD036 -->
<!--more-->
## Q1: AppModule中引入的模块太多，需要修改某个应用层级的功能时经常找不到地方

`AppModule`是应用的根模块，我们应该将服务场景是全应用级的服务和模块添加到这里。因此根模块往往会承担许多功能，例如主题、认证、本地化、权限控制等等。

[ng-alain](https://github.com/ng-alain/ng-alain)在国内的Angular项目中很常用，我们就以它为例，先来看一下ng-alain提供的脚手架中`AppModule`引入了哪些模块。

```ts
// app.module.ts
@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,              // 应用基础设施模块
    BrowserAnimationsModule,    // 动画模块
    HttpClientModule,           // http模块
    DelonModule.forRoot(),      // ng-alain的核心第三方模块
    CoreModule,                 // 核心模块
    SharedModule,               // 共享模块
    LayoutModule,               // 布局模块
    RoutesModule,               // 路由模块
    ...FORM_MODULES,            // 自定义的表单模块
    ...GLOBAL_THIRD_MODULES,    // 可供拓展的全局第三方模块列表
  ],
  providers: [
    ...LANG_PROVIDES,           // 本地化服务
    ...INTERCEPTOR_PROVIDES,    // http拦截器服务
    ...APPINIT_PROVIDES         // app初始化服务
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
```

嗯，确实不少。除了Angular官方提供的常用模块外，还有核心模块和一些第三方模块等等。问题来了，我需要修改认证相关的功能，应该去哪里找？从`AppModule`中并没有发现直接的线索，有可能是在`CoreModule`中。这是`CoreModule`的代码。

```ts
@NgModule({
  providers: [],
})
export class CoreModule {
  constructor(@Optional() @SkipSelf() parentModule: CoreModule) {
    throwIfAlreadyLoaded(parentModule, 'CoreModule');
  }
}
```

看来我们猜错了，`CoreModule`中并没有输出任何服务提供给根模块。那有可能是那个核心的第三方模块`DelonModule`。这是`DelonModule`的代码。

```ts
const GLOBAL_CONFIG_PROVIDES = [
  { provide: STConfig, useFactory: fnSTConfig },
  { provide: PageHeaderConfig, useFactory: fnPageHeaderConfig },
  { provide: DelonAuthConfig, useFactory: fnDelonAuthConfig },
];

...

@NgModule({
  imports: [AlainThemeModule.forRoot(), DelonACLModule.forRoot(), ...MOCK_MODULES],
})
export class DelonModule {
  static forRoot(): ModuleWithProviders {
    return {
      ngModule: DelonModule,
      providers: [...REUSETAB_PROVIDES, ...GLOBAL_CONFIG_PROVIDES],
    };
  }
}
```

`DelonModule.forRoot()`会返回一个`ModuleWithProviders`对象，如同它名字的意义，它将模块和服务打包在一起。其中的`providers`中引入了`GLOBAL_CONFIG_PROVIDES`。这是个数组，在这里面我们找到了关于认证配置的服务提供商`DelonAuthConfig`。很幸运，我们尝试了两次就找到了。但如果你不仔细去看`GLOBAL_CONFIG_PROVIDES`里面都有什么的话，那你可能就错过了。

无疑这样的寻找过程对于一个不了解delon的人是充满心智负担的，他可能很难找到认证服务相关代码写在哪里。如果在一开始我们就能从目录结构上明显的看到认证服务在哪里，那该多好呀！

因此，我们有必要为`AppModule`减负，它承担了太多。

俗话说，**不是一家人，不进一家门。** 如果AppModule中仅仅引入angular的自家人————`BrowserModule`、`HttpClientModule`等模块用于基础功能服务，而将其他拓展功能交由`CoreModule`来负责（这也是`CoreModule`设计的初衷），岂不美哉？

现在我们就来试一下这种模块组织方式。

将`AppModule`中第三方提供的功能服务全部移交给`CoreModule`，仅仅保留angular自家人。

```ts
// app.module.ts
@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    RouteRoutingModule,
    CoreModule.forRoot()],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
```

`AppModule`清爽多了！同时我们拥有了一个强大的`CoreModule`，它提供了一些第三方的应用级服务。

```ts
// core.module.ts
@NgModule({
  imports: [
    AlainThemeModule.forRoot(),     // 主题模块
    DelonACLModule.forRoot()        // 权限控制模块
  ],
})
export class CoreModule {
  static forRoot(): ModuleWithProviders {
    return {
      ngModule: CoreModule,
      providers: [
        ...INTERCEPTOR_PROVIDES,    // http拦截服务
        ...LANG_PROVIDES,           // 本地化服务
        ...APPINIT_PROVIDES,        // 应用初始化服务
        ...ABC_CONFIG_PROVIDES,     // @delon/abc 组件配置服务
        ...REUSETAB_PROVIDES,       // delon 路由复用服务
        ...AUTH_CONFIG_PROVIDES,    // 认证服务
      ],
    };
  }
}
```

然后我们将`CoreModule`和它的服务提供商们，都放进一个core目录下。

```bash
├── core                                # 核心模块
    ├── abc-config.provides.ts          # @bixi/abc的全局配置服务提供商
    ├── app-initializer.provides.ts     # App 初始化服务提供商
    ├── auth.provides.ts                # 认证服务提供商
    ├── core.module.ts                  # 核心模块文件
    ├── http-interceptor.provides.ts    # http 拦截器服务提供商
    ├── locale.provides.ts              # 本地化服务提供商
    └── reusetab.provides.ts            # 路由服用服务提供商
```

嗯，看起来好多了。现在我们想要找到认证服务等等，就会直接去core目录下，简直是一目了然。

## Q2: 某个业务相关的需求变动时，经常需要改动几个不同目录下的代码

业务是复杂多变的，一个业务往往会涉及到多个模块、组件、服务等等。

以下用一个常见的用户登录注册场景为例，假如用户登录后需要展示用户的一些个人信息（头像、昵称等等）。于是我们在passport中添加了一个user-profile组件用于展示用户信息，以及一个user-profile.service.ts用于提供user-profile用到的相关服务。与此同时，user路由下还有一个单独的detail页面用于展示用户详情，因此在user目录下我们引入了user.service.ts。

```bash
├── routes
    ├── passport
        ├── login
        ├── user-profile
            ├── user-profile.component.ts
        ├── passport-routing.module.ts
        ├── passport.service.ts
        ├── user-profile.service.ts
        └── passport.module.ts
    ├── user
        ├── detail
        ├── user.service.ts
        ├── user-routing.module.ts
        └── user.module.ts
```

那么问题来了，user-profile.service.ts和user.service.ts显然都和用户相关。如果用户相关的业务发生了改动，我们就需要检查两个目录下的服务，看看是否会收到影响。更糟糕的是，甚至可能有其它的目录下也包含了用户相关的一些服务，而你并没有发现它！看来，我们需要加个班了，挨个点开每个目录，小心翼翼地检查它们有没有包含用户服务，然后改动它们。

没有人想加班，至少我们不想。有没有更好的办法解决这个问题？

看看user-profile.service.ts和user.service.ts，它们都是和用户相关的服务，它们的关系是那么亲密，只是被无情地分到了不同的目录下了。所以我们决定，**相爱的人就让他们在一起！**

将user相关的组件和服务全部移至user目录下。

```bash
├── routes
    ├── passport
        ├── login
        ├── passport-routing.module.ts
        ├── passport.service.ts
        └── passport.module.ts
    ├── user
        ├── detail
        ├── user-profile
            ├── user-profile.component.ts
            ├── user-profile.module.ts
        ├── user.service.ts
        ├── user-routing.module.ts
        └── user.module.ts
```

现在和user相关的代码都放入了同一个目录下，如果用户相关业务发生了变动，我们只需要在这里修改代码。至于passport想要使用user-profile这个组件，只需要引入`UserModule`即可。愿天下有情人终成眷属，故事到此圆满结束了————吗？

在`PassportModule`中引入`UserModule`？且不说仅仅是为了用一个小小的user-profile组件就引入了整个user模块，更关键的是：`PassportModule`和`UserModule`都是被懒加载的带路由模块啊！如果这样引用的话，那么在passport的路由下，不仅会加载`PassportModule`，也会加载`UserModule`，这显然是不合理的。

这种情况很棘手，我们可以把它归纳为：一个带路由模块复用了另一个带路由模块中的一些部件（比如组件、服务、管道等等）。往常我们只需要在`imports`属性中添加那个模块即可，但对于带路由模块来说行不通了。

其实这种情形可以类比我们熟悉的组件复用方式：如果两个不同的组件复用了某部分相同的构造，我们可以将这部分构造提取形成一个较小的组件，即可被复用。同样的，对于模块之间部分构造的复用，我们也把它提取出来，用`NgModule`模块化，然后引入这个模块即可。(多说一句，对于react来说，一切都是组件。但在angular的世界里，一切都是模块。)

因此，你会看到在刚才的目录结构中，我添加了user-profile.module.ts这个文件。对于passport来说，它只需要引入`UserProfileModule`即可使用user-profile组件。

## Q3: SharedModule中导出了太多的东西，可我只需要一小部分就够了

通常应用中都会有一个shared目录，它拥有一个`SharedModule`。我们会将那些可能会在应用中到处使用的组件、指令和管道统统放入`SharedModule`中。而我见到过一种特别常见的实践就是：将一切被复用的东西都扔进了`SharedModule`中，理由很简单：因为它们被"shared"。因此就形成了一个巨大的`SharedModule`，它容纳了许多引入`SharedModule`的模块做梦也想不到的东西。

然而我们的模块并不如此多情。相较于**我全都要！**, 它们更喜欢**弱水三千，只取一瓢饮。**

如果仔细看看shared目录下的那些东西，有相当一部分是带有各种各样的前缀的。这时候我们就应该反思一下自己，是不是又拆散了“有情人”。前缀往往意味着文件需要一个更合适它们的地方，别忘了我们刚才说的，**相爱的人就让他们在一起**。

这样做之后，shared目录里剩下的东西一般会有这样的特征：所有的带路由模块**都可能**需要、不和具体的业务关联、很少有服务。因此，共享模块中的“共享”其实指的是和所有人共享，而不是仅仅属于某些人。

## 总结

通过这三个问题的解答，一个良好的目录结构在我们面前逐渐清晰。

```bash
├── app
    ├── core                                # 核心模块
    ├── passport                            # 登录注册模块
    ├── user                                # 用户模块
    ├── layout                              # 布局模块
    ├── shared                              # 共享模块
    ├── app-routing.module.ts               # 根应用路由模块
    ├── app.component.ts                    # 根组件
    └── app.module.ts                       # App 引导模块
```

在这里我移除了routes这一目录层级，这让应用看起更扁平，对我们定位代码是有好处的。如果你的路由特别特别多，可以再考虑加上routes这层目录。

至此，我们的目录结构就完整了。它清晰优美，让人不忍心破坏它的简洁。值得多说一句的是，像`PassportModule`、`UserModule`这样的带路由模块，我更愿意称它们为领域模块。因为它们代表的是一个业务领域，路由只是它的其中之一的特性。所以我们的应用结构也可以理解为这样：核心模块、业务领域模块、布局模块、共享模块。

现在，我们已经知道了如何组织良好的目录结构。重新审视我们的代码，看看是否会出现上述的三个问题，把它们放到更合理的位置吧！

参考：
> [应用程序结构与 NgModule](https://angular.cn/guide/styleguide#application-structure-and-ngmodules)
> [特性模块的分类](https://angular.cn/guide/module-types)
> [ng-alain模块注册指导原则](https://ng-alain.com/docs/module/zh)
> [Angular Folder Structure](https://medium.com/@motcowley/angular-folder-structure-d1809be95542)
> [How to define a highly scalable folder structure for your Angular project](https://itnext.io/choosing-a-highly-scalable-folder-structure-in-angular-d987de65ec7)
