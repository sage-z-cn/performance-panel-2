# Wallpaper Engine Web Guide

> 来源：https://docs.wallpaperengine.io/en/web/overview.html
> 抓取时间：2026-06-07
> 本文档为 Wallpaper Engine 官方 Web Wallpaper 开发文档的完整中文备份，供开发参考。

---

## 目录

- [Web Wallpaper 参考指南](#web-wallpaper-参考指南)
- [创建 Web 壁纸](#创建-web-壁纸)
- [用户自定义](#用户自定义)
  - [用户属性](#用户属性)
  - [属性显示条件](#属性显示条件)
  - [属性翻译](#属性翻译)
- [API 参考](#api-参考)
  - [wallpaperPropertyListener 参考](#wallpaperpropertylistener-参考)
- [音频可视化](#音频可视化)
  - [音频可视化](#音频可视化-1)
  - [媒体集成](#媒体集成)
- [性能](#性能)
  - [FPS 限制器](#fps-限制器)
- [RGB 设备](#rgb-设备)
  - [RGB 硬件支持](#rgb-硬件支持)
  - [Corsair iCUE 额外功能](#corsair-icue-额外功能)
- [调试](#调试)
  - [Web 壁纸调试](#web-壁纸调试)

---

# Web Wallpaper 参考指南

Wallpaper Engine 设计器文档的此部分将指导你创建基于 HTML、CSS 和 JavaScript 的壁纸。本网站不旨在教你 HTML、CSS 和 JavaScript，只会解决 Wallpaper Engine 特有的主题。网上有很多教程、指南和课程，Wallpaper Engine 是学习和改进这些 Web 技术的绝佳方式。

> **提示**：如果你想使用 Wallpaper Engine 编辑器创建壁纸，应查看 [Scene Wallpapers 文档](https://docs.wallpaperengine.io/en/scene/overview.html)。

Wallpaper Engine 暴露了自己的接口，你可以使用这些接口为基于 Web 的壁纸添加额外功能：用户自定义、音频可视化器、支持的硬件的 RGB 效果、用户可配置的 FPS 限制等。视频文件也可以是 Web 壁纸的一部分，但仅支持 **.webm**、**.ogg** 和 **.ogv** 视频文件。

---

# 创建 Web 壁纸

## 导入项目

要导入基于 Web 的壁纸项目，首先将你的主 HTML 文件放在一个文件夹中，与壁纸所需的所有文件放在一起。Wallpaper Engine 会读取所选目录及其所有子目录中的所有文件，如果你意外导入了大量不相关的文件，可能会导致进程冻结。

> **重要**：在开始导入之前，请务必将 HTML 文件和所有相关文件放在一个专用的项目文件夹中。

设置好项目目录后，只需将主 HTML 文件拖放到 Wallpaper Engine 编辑器中的 **Create Wallpaper** 按钮上。这将启动导入过程并将所有文件复制到 Wallpaper Engine 项目目录中。请注意，这会将文件的副本放置在 `wallpaper_engine\projects\myprojects\` 目录中。你可以通过单击编辑器顶部的 **Edit** → **Open in Explorer** 来查看和编辑复制的文件。

你还会注意到 Wallpaper Engine 在 Web 项目的主目录中创建了一个 `project.json` 文件。此文件包含一些项目特定的配置，例如所有用户属性的列表。

你可以通过单击编辑器菜单顶部的 **Workshop** → **Share wallpaper on Workshop** 来发布壁纸。使用相同的 Wallpaper Engine 项目再次执行此过程将会导致向所有用户发布现有壁纸的更新。

## 开始之前

创建基于 Web 的壁纸时，除非绝对必要，避免从网络上加载任何重要的壁纸文件。你应该将任何图片、HTML、CSS 和 JavaScript 文件（包括 JavaScript 框架）与壁纸捆绑在一起，以便所有文件都在本地加载。这确保你的壁纸不会因为用户暂时离线或托管文件的服务器无法访问而崩溃。

你还应该确保你的壁纸能够良好地适配不同的分辨率和宽高比，Web 壁纸应该在任何类型的屏幕上动态缩放，务必同时检查不太常见的宽高比（如 21:9）的超宽分辨率。

---

# 用户自定义

## 用户属性

Wallpaper Engine 允许你通过向项目添加*用户属性*，让用户能够配置壁纸的部分内容。这些用户属性会在用户选择你的壁纸时显示在 Wallpaper Engine **Installed** 标签页的右侧。在本指南中，我们将解释如何创建属性、每种属性类型的含义以及如何通过 JavaScript 访问它们。

### 创建用户属性

你可以通过在 Wallpaper Engine 编辑器中打开你的 Web 项目，导航到顶部的 **Edit** 菜单，选择 **Change Project settings** 来创建新属性。然后你可以点击 **Add Property** 按钮来创建新属性。以下用户属性类型可供创建：

- **Color**（`color`）：颜色选择器
- **Slider**（`slider`）：允许用户在指定范围内选择数字的滑块
- **Checkbox**（`bool`）：开关复选框
- **Combo**（`combo`）：下拉选择器，每个元素有一个文本和一个隐藏值
- **Text**（`textinput`）：文本输入字段
- **File**（`file`）：文件选择器，用于导入图片或视频
- **Directory**（`directory`）：目录选择器，用于批量导入图片或视频文件

### 读取属性值

你可以使用 `wallpaperPropertyListener` 及其 `applyUserProperties` 事件，该事件在用户更改壁纸属性或壁纸首次加载时触发。该事件仅包含值已更改的属性，因此务必始终检查属性是否包含在事件中，如下例所示（`yourproperty` 和 `anotherproperty` 应替换为属性的实际 key）：

```javascript
window.wallpaperPropertyListener = {
    applyUserProperties: function(properties) {
        if (properties.yourproperty) {
            // 处理 yourproperty
        }
        if (properties.anotherproperty) {
            // 处理 anotherproperty
        }
        // 在此添加更多属性
    },
};
```

该事件也会在壁纸加载时触发一次，包含所有用户属性。务必为每个用户属性分配一个 `if` 条件，如上例所示，以确保事件在壁纸加载时和用户更改单个属性值时都能正常工作。

> **重要**：始终确保将 `window.wallpaperPropertyListener` 初始化为在任何事件之外的全局对象，否则可能会错过壁纸加载时的一些重要属性更新事件。

用于访问属性的 key 是在创建属性时自动生成的。你可以使用元素右侧的编辑按钮在创建属性之前编辑它。key 不能包含任何特殊字符，只能使用英文和数字字符。

特别是如果你的属性使用外语标题或包含特殊字符，你应该设置一个便于理解属性 key 含义的自定义 key。

### 属性概览

#### Color 属性

颜色属性允许用户选择一种颜色，你可以将其用于 HTML 元素的 CSS 规则或 Canvas 绘图等。你可以配置默认颜色，除此之外颜色选择器配置很简单。

颜色属性将返回三个用空格分隔的数值（例如 `1.0 0.1 0.25`）。要在 CSS 规则中使用这些值，你需要先将它们转换为通常的 0 到 255 值范围，可以使用 `split` 和 `map` 函数，如下例所示：

```javascript
window.wallpaperPropertyListener = {
    applyUserProperties: function(properties) {
        if (properties.customcolor) {
            // 将自定义颜色转换为 0 - 255 范围以用于 CSS
            var customColor = properties.customcolor.value.split(' ');
            customColor = customColor.map(function(c) {
                return Math.ceil(c * 255);
            });
            var customColorAsCSS = 'rgb(' + customColor + ')';
            // 在此使用该值做有用的事情或将其赋值给全局变量
        }
    },
};
```

请确保将 `properties.customcolor` 替换为颜色属性的实际 key。

#### Slider 属性

滑块属性类型是让用户在预定义范围内调整数值变量的好方法。你需要配置*默认值*、*最小值*和*最大值*来约束滑块的默认状态和范围。此外，你可以启用 *Fraction* 选项，允许用户选择小数。如果启用了 *Fraction* 选项，会出现 *Precision* 选项，允许你进一步指定用户可用的小数位数。默认精度设置为 **2**，这意味着用户可以以 **0.1** 的步长选择数字。

```javascript
window.wallpaperPropertyListener = {
    applyUserProperties: function(properties) {
        if (properties.customslider) {
            var mySliderValue = properties.customslider.value;
            // 在此使用该值做有用的事情或将其赋值给全局变量
        }
    },
};
```

#### Checkbox 属性

复选框属性类型是一个简单的布尔开关，值为 `true` 或 `false`。你可以在设置复选框属性时设置默认状态。

```javascript
window.wallpaperPropertyListener = {
    applyUserProperties: function(properties) {
        if (properties.customcheckbox) {
            var myCheckboxValue = properties.customcheckbox.value;
            // 在此使用该值做有用的事情或将其赋值给全局变量
        }
    },
};
```

#### Combo 属性

组合框属性向用户显示一个下拉选择列表，由文本标签和隐藏值组成，你需要在设置此属性类型时配置这两者。

```javascript
window.wallpaperPropertyListener = {
    applyUserProperties: function(properties) {
        if (properties.customcombo) {
            var myComboValue = properties.customcombo.value;
            // 在此使用该值做有用的事情或将其赋值给全局变量
        }
    },
};
```

此外，你还可以通过 `.text` 访问标签本身，但通常应坚持只处理值。

#### Text 属性

文本属性类型是一个用户可配置的字符串。你可以在编辑器中设置属性时设置默认字符串。

```javascript
window.wallpaperPropertyListener = {
    applyUserProperties: function(properties) {
        if (properties.customtext) {
            var myTextValue = properties.customtext.value;
            // 在此使用该值做有用的事情或将其赋值给全局变量
        }
    },
};
```

#### File 属性

文件属性类型允许你添加一个选项，让用户加载可选的图片或视频，然后你可以将其整合到壁纸中。你的壁纸应该在没有此文件的情况下也能正常工作，因此最好创建某种回退情况（例如使用默认图片/视频或纯色）。

文件属性有一个 **file type** 选项，允许你定义用户是加载 **image file**（**.jpeg**、**.jpg**、**.png**、**.pnga**、**.bmp**、**.gif**、**.svg**、**.webp**）还是 **video file**（**.webm**、**.ogg**、**.ogv**）。

需要注意的是，你需要在 `value` 对象返回的文件位置前添加 `file:///`，以便 Wallpaper Engine 的 Web 浏览器能够读取它：

```javascript
window.wallpaperPropertyListener = {
    applyUserProperties: function(properties) {
        if (properties.customimage) {
            // 读取文件
            var customImageFile = 'file:///' + properties.customimage.value;
            // 将文件分配给图像元素的 src 属性
            imageElement = document.getElementById('SomeImageElement');
            imageElement.src = customImageFile;
        }
    },
};
```

你也可以将值通过 `url('')` 分配给 CSS 背景图像，在这种情况下，请确保不要忘记内部的引号：

```javascript
canvas.style.backgroundImage = "url('file:///" + properties.customimage.value + "')";
```

#### Directory 属性

目录属性在你希望允许用户批量导入图片或视频文件时非常有用。如果你想构建幻灯片或其他依赖大量图片或视频文件的壁纸，这可能很有用。

目录属性有两种操作模式，你可以在设置属性时选择：`ondemand` 模式和 `fetchall` 模式。

目录属性有一个 **file type** 选项，允许你定义是从目录加载 **image files** 还是 **video files**。

##### "ondemand" 目录

配置为 `ondemand` 模式的目录属性允许用户选择一个目录，你可以在壁纸需要新图片时从该目录加载图片。为此，你可以使用 Wallpaper Engine 提供的预定义 `window.wallpaperRequestRandomFileForProperty` 函数。该函数有两个参数，第一个参数必须是目录属性的确切 key，第二个参数是一个回调函数，该函数会使用返回的图片文件路径做一些处理。

要循环显示图片，只需在定时器上调用此函数即可：

```javascript
function randomImageResponse(propertyName, filePath) {
    imageElement = document.getElementById('UserImage');
    imageElement.src = 'file:///' + filePath;
}
window.wallpaperRequestRandomFileForProperty('customrandomdirectory', randomImageResponse);
```

此外，你还应该像处理其他属性一样监听属性本身的变化。你应该对目录的变化做出反应，并处理用户完全移除所选目录的情况：

```javascript
window.wallpaperPropertyListener = {
    applyUserProperties: function(properties) {
        if (properties.customrandomdirectory) {
            if (properties.customrandomdirectory.value) { 
                // 目录已设置
            } else {
                // 未设置目录
            }
        }
    },
}
```

##### "fetchall" 目录

配置为 `fetchall` 模式的目录属性允许你获取大量文件路径，然后可以按你的意愿处理它们，但你应该确保壁纸不会仅仅因为用户选择了大目录就加载无限数量的图片或视频文件。所有文件路径必须前缀 `file:///` 才能访问。

与其他属性不同，设置为 `fetchall` 模式的目录属性需要你在 *wallpaperPropertyListener* 中使用 `userDirectoryFilesAddedOrChanged` 和 `userDirectoryFilesRemoved` 事件，而不是 *applyUserProperties*。这两个事件回调允许你跟踪用户选择中添加（或修改）和删除的所有文件：

```javascript
window.wallpaperPropertyListener = {
    userDirectoryFilesAddedOrChanged: function(propertyName, changedFiles) {
        // propertyName 是触发事件的属性名称
        // changedFiles 包含所有添加（或修改）的文件路径
    },
    userDirectoryFilesRemoved: function(propertyName, removedFiles) {
        // propertyName 是触发事件的属性名称
        // removedFiles 包含所有已删除的文件路径
    }
};
```

## 属性显示条件

特别是当你添加大量属性时，属性列表可能会变得难以导航。使用*显示条件*，你可以有条件地隐藏某些属性，只在它们相关时才显示。

例如，假设你的壁纸中添加了一个时钟，并且你想添加两个选项：一个属性用于完全禁用时钟，另一个用于在 24 小时和 12 小时制之间切换。在这种情况下，在时钟被禁用时隐藏 24 小时选项是合理的，因为该选项在那时对用户来说变得无关紧要。

要实现这一点，首先创建时钟属性并记下它的 key。在我们的示例中，假设属性 key 是 `showclock`。属性创建后，创建一个名为 *24H Clock* 的新属性。在属性创建页面上，你将看到配置*显示条件*的选项。这允许你编写一个 JavaScript 兼容的 `if` 条件，决定属性何时对用户可见。

在我们的例子中，我们希望可见性取决于 `showclock` 的值，因此我们将显示条件设置为依赖该属性的 `value` 是否为 `true`：

```
showclock.value == true
```

这样，我们的 *24H Clock* 属性只在用户同时启用了 *Show Clock* 属性时才可见。

## 属性翻译

你可以为属性和属性值创建翻译，使你的 Web 壁纸更易于全球受众访问。Wallpaper Engine 会根据 **General** 设置标签页中配置的语言动态加载适当的语言。

这有点高级，因为它要求你访问 Wallpaper Engine 自动生成在项目目录中的 `project.json`，所以在编辑时请确保不要破坏任何 JSON 语法。

要翻译属性，打开 `project.json`，在 `properties` 旁边添加一个新对象 `localization`。该对象包含每种语言的简写表示法的成员（查看 `wallpaper_engine` 安装目录中 `locale` 目录下的文件，了解当前所有可用语言）。

接下来，你需要将所有属性标签和属性选项标签更改为以 `ui_` 开头的标记。

> **提示**：确保所有标签都以 `ui_` 开头，否则 Wallpaper Engine 将不会识别它们为可翻译标记。

以下是 `project.json` 的示例结构：

```json
{
    "file" : "index.html",
    "general" : 
    {
        "properties" : 
        {
            "backgroundcolor" : 
            {
                "index" : 0,
                "options" : 
                [
                    {
                        "label" : "ui_background_color_red",
                        "value" : "255 0 0"
                    },
                    {
                        "label" : "ui_background_color_green",
                        "value" : "0 255 0"
                    },
                    {
                        "label" : "ui_background_color_blue",
                        "value" : "0 0 255"
                    }
                ],
                "order" : 100,
                "text" : "ui_backgroundcolor",
                "type" : "combo",
                "value" : "255 0 0"
            }
        },
        "localization" : 
        {
            "en-us" :
            {
                "ui_backgroundcolor" : "Background color",
                "ui_background_color_red" : "Red",
                "ui_background_color_green" : "Green",
                "ui_background_color_blue" : "Blue"
            },
            "de-de" :
            {
                "ui_backgroundcolor" : "Hintergrundfarbe",
                "ui_background_color_red" : "Rot",
                "ui_background_color_green" : "Grün",
                "ui_background_color_blue" : "Blau"
            },
            "zh-chs" :
            {
                "ui_backgroundcolor" : "背景颜色",
                "ui_background_color_red" : "红色",
                "ui_background_color_green" : "绿色",
                "ui_background_color_blue" : "蓝色"
            }
        }
    },
    "title" : "Test Project",
    "type" : "web"
}
```

---

# API 参考

## wallpaperPropertyListener 参考

Wallpaper Engine 在全局 `window` 对象上提供了一个 `wallpaperPropertyListener`，你可以使用它来响应不同的事件。本页概述了 Wallpaper Engine 提供的所有事件，你只需创建一个包含壁纸所需的所有回调的 `wallpaperPropertyListener` 即可。

> **重要**：始终确保将 `window.wallpaperPropertyListener` 初始化为在任何事件之外的全局对象，否则可能会错过壁纸加载时的一些重要属性更新事件。

### applyUserProperties

`applyUserProperties` 在用户更改壁纸属性或壁纸首次加载时触发。该事件仅包含值已更改的属性，因此务必始终检查属性是否包含在事件中：

```javascript
window.wallpaperPropertyListener = {
    applyUserProperties: function(properties) {
        if (properties.yourproperty) {
            // 复选框/布尔值示例，根据属性类型更改
            if (properties.yourproperty.value == true) {
                // 属性为 true 时执行
            } else {
                // 属性为 false 时执行
            }
        }
    },
};
```

### applyGeneralProperties

`applyGeneralProperties` 事件在用户更改 Wallpaper Engine 主要设置时触发。它主要用于获取用户配置的 FPS 限制：

```javascript
window.wallpaperPropertyListener = {
    applyGeneralProperties: function(properties) {
        if (properties.fps) {
            // 添加逻辑以将壁纸限制到新的 FPS 设置
        }
    },
};
```

### setPaused

`setPaused` 事件在壁纸暂停或取消暂停时触发（Wallpaper Engine 会完全冻结渲染壁纸的进程，但在某些情况下你可能仍想响应暂停/取消暂停事件）：

```javascript
window.wallpaperPropertyListener = {
    setPaused: function(isPaused) {
        if (isPaused) {
            // 暂停时执行
        } else {
            // 取消暂停时执行
        }
    },
};
```

### userDirectoryFilesAddedOrChanged

当你使用启用 `fetchall` 模式的 `directory` 类型用户属性时，可以使用此事件。该事件将包含用户**添加**或**更改**的所有文件的完整文件路径：

```javascript
window.wallpaperPropertyListener = {
    userDirectoryFilesAddedOrChanged: function(propertyName, changedFiles) {
        // 在此处理添加的文件列表
    },
};
```

### userDirectoryFilesRemoved

当你使用启用 `fetchall` 模式的 `directory` 类型用户属性时，可以使用此事件。该事件将包含用户**删除**的所有文件的完整文件路径：

```javascript
window.wallpaperPropertyListener = {
    userDirectoryFilesRemoved: function(propertyName, removedFiles) {
        // 在此处理已删除的文件列表
    },
};
```

---

# 音频可视化

## 音频可视化

Wallpaper Engine 允许你处理左右声道的音频音量级别，并使用这些数据来可视化用户系统上正在播放的音频。每个声道将音频频率分为 64 个部分。每个部分代表音频的一个频率范围：低频代表低音，高频代表高音范围。

利用这些音量级别，你可以构建各种类型的音频可视化，从完整的条形音频可视化器，到使壁纸上的某些元素对音乐节拍做出反应（通过仅查看低频范围，因为它们通常代表正在播放的音频的节拍）。

### 创建音频监听器

要开始使用音频可视化器，你需要在 JavaScript 中注册一个监听器函数，该函数将为你提供音频音量级别。Wallpaper Engine 为此提供了 `window.wallpaperRegisterAudioListener` 函数，它需要一个你还需要创建的回调函数。

你应该调用 `wallpaperRegisterAudioListener` 函数一次。请注意：不要在 `window.onload` 事件（或任何类似事件）中注册音频监听器，这是不可靠的，可能导致 Wallpaper Engine 错过某些事件。如有疑问，请在 `body` 标签末尾调用此函数。

```javascript
function wallpaperAudioListener(audioArray) {
    // 在此处理音频输入
}
window.wallpaperRegisterAudioListener(wallpaperAudioListener);
```

`wallpaperAudioListener` 函数将在新音频样本到达时被调用，大约每秒 30 次。

### 处理音频样本

实际的音频数据包含在我们上面创建的 `audioArray` 中。该数组的固定长度为 **128**。

数组元素 **0 到 63** 包含**左声道**的音量级别。数组元素 **64 到 127** 包含**右声道**的音量级别。

每个声道中较低的数组元素代表低音频率，因此在数组索引 0 处，你将找到左声道的最低低音，在数组元素 64 处，你将找到右声道的低音。数组中的位置越高，音频频率就越高，因此最接近 64 的数组索引将包含左声道的高音音量级别，最接近数组索引 127 的数组索引将包含右声道的高音音量级别。

每个数组通常包含从 0.00 到 1.00 的浮点值。0.00 表示特定频率当前没有播放任何声音，1.00 表示该频率正在以最大音量播放。然而，由于技术实现的缘故，在极少数情况下，数值可能远大于 1.0。因此，我们建议使用 `Math.min()` 将音量值限制在 1.00。

### 音频可视化示例

以下是一个非常基础的音频可视化器的完整实现示例。你可以轻松地将其复制粘贴到一个空的 `.html` 文件中，导入到 Wallpaper Engine 中，它应该立即生效：

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <style>
        body { margin:0; padding:0; }
        html, body { width:100%; height:100%; overflow:hidden; }
        canvas { height:100vh; width:100vw }
    </style>
    </head>
    <body>
        <canvas id="AudioCanvas"></canvas>
        <script>
        let audioCanvas = null;
        let audioCanvasCtx = null;
        function wallpaperAudioListener(audioArray) {
            // 清除画布并将其设置为黑色
            audioCanvasCtx.fillStyle = 'rgb(0,0,0)';
            audioCanvasCtx.fillRect(0, 0, audioCanvas.width, audioCanvas.height);
            // 沿画布全宽渲染条形
            var barWidth = Math.round(1.0 / 128.0 * audioCanvas.width);
            var halfCount = audioArray.length / 2;
            // 从左声道开始，红色
            audioCanvasCtx.fillStyle = 'rgb(255,0,0)';
            // 遍历前 64 个数组元素（0 - 63）获取左声道音频数据
            for (var i = 0; i < halfCount; ++i) {
                var height = audioCanvas.height * Math.min(audioArray[i], 1);
                audioCanvasCtx.fillRect(barWidth * i, audioCanvas.height - height, barWidth, height);
            }
            // 现在绘制右声道，蓝色
            audioCanvasCtx.fillStyle = 'rgb(0,0,255)';
            // 遍历后 64 个数组元素（64 - 127）获取右声道音频数据
            for (var i = halfCount; i < audioArray.length; ++i) {
                // 使用 audioArray[191 - i] 反转右声道以达到美观效果
                var height = audioCanvas.height * Math.min(audioArray[191 - i], 1);
                audioCanvasCtx.fillRect(barWidth * i, audioCanvas.height - height, barWidth, height);
            }
        }
        // 页面加载后获取音频画布
        audioCanvas = document.getElementById('AudioCanvas');
        // 将内部画布分辨率设置为用户屏幕分辨率
        audioCanvas.height = window.innerHeight;
        audioCanvas.width = window.innerWidth;
        // 获取画布的 2D 上下文以在 wallpaperAudioListener 中绘制
        audioCanvasCtx = audioCanvas.getContext('2d');
        // 注册 Wallpaper Engine 提供的音频监听器
        window.wallpaperRegisterAudioListener(wallpaperAudioListener);
        </script>
    </body>
</html>
```

### 关键实现细节

#### 规范化浏览器样式

CSS 规则中的 `<style>` 块允许画布适配任何分辨率和任何宽高比。你应始终确保壁纸适用于任何类型的屏幕分辨率和宽高比，仅考虑一种分辨率是不良实践。

#### JavaScript 初始化和规范化

对于 JavaScript 代码，重要的是避免使用 `window.onload` 函数和任何类似的 window 事件，至少在涉及 Wallpaper Engine 特定代码时如此，因为这可能导致事件系统出现问题。将 JavaScript 放在 `body` 标签内部末尾是完全有效的。

如果你从未使用过 `canvas` 元素，重要的是要知道它们使用内部分辨率进行渲染，使用次要分辨率用于 HTML/CSS 中的大小，因此最好使用 JavaScript 将画布的高度和宽度专门设置为窗口高度和宽度：

```javascript
audioCanvas.height = window.innerHeight;
audioCanvas.width = window.innerWidth;
```

### 音频可视化器故障排除

为了节省性能，Wallpaper Engine 不会向壁纸发送音频数据，除非你在壁纸代码中实际加载了 `wallpaperAudioListener`。Wallpaper Engine 在编辑器预览中检测到正确注册的音频监听器后，会自动将以下行添加到 `project.json`：

```json
"supportsaudioprocessing" : true,
```

如果你在开发过程中遇到问题，可以使用编辑器中的 **Save** 功能强制 Wallpaper Engine 更新你的 `project.json`。作为最后手段，你也可以手动将上述行添加到 `project.json`。

如果可视化器仍有问题，建议按照以下教程设置 Wallpaper Engine 的调试器连接：
- [Web Wallpaper Debugging](#web-壁纸调试)

## 媒体集成

Wallpaper Engine 允许你访问来自某些媒体播放器的当前播放音乐和视频信息，包括 Spotify 或 Tidal 等流媒体平台。任何通过 Windows 全局媒体会话提供曲目信息的应用程序都可以使用。此功能可能需要先在播放内容的应用程序中启用。

你通常可以访问低分辨率专辑封面图片、当前播放内容的标题和艺术家。某些应用程序可能提供额外信息，如播放时间/时长。

### 可用的媒体集成监听器

有多个事件监听器可用于访问不同类型的信息，它们只在当前播放媒体的特定部分发生变化时触发。你应该确保立即注册监听器，而不是在超时后或在 `window.onload` 中。如有疑问，请在 `body` 标签末尾注册监听器。

#### MediaStatusListener

当用户在应用设置中打开或关闭媒体集成时，将调用此事件函数。

**属性**：
- `enabled`: Boolean —— 用户当前是否已启用媒体集成选项

```javascript
function wallpaperMediaStatusListener(event) {
}
window.wallpaperRegisterMediaStatusListener(wallpaperMediaStatusListener);
```

#### MediaPropertiesListener

当当前播放媒体的属性更改时，将调用此事件函数。它包含歌曲标题、艺术家姓名、专辑名称等文本信息。

**属性**：
- `title`: String —— 当前播放媒体的标题
- `artist`: String —— 当前播放媒体的艺术家
- `subTitle`: String —— 可选的副标题
- `albumTitle`: String —— 可选的专辑标题
- `albumArtist`: String —— 可选的专辑艺术家
- `genres`: String —— 可选的逗号分隔流派列表
- `contentType`: String —— 媒体类型，可以是 `music`、`video` 或 `image`

```javascript
function wallpaperMediaPropertiesListener(event) {
}
window.wallpaperRegisterMediaPropertiesListener(wallpaperMediaPropertiesListener);
```

#### MediaThumbnailListener

当当前播放媒体的缩略图更改时，将调用此事件函数。它包含专辑封面的缩略图和额外信息，如专辑封面中使用的主要、次要和第三颜色，你可以在壁纸中使用这些颜色。缩略图字符串可以作为 `img` 元素的 `src` 参数设置：`document.getElementById('mediaThumbnail').src = event.thumbnail;`

**属性**：
- `thumbnail`: String —— 当前专辑封面的 Base64 编码 PNG 字符串
- `primaryColor`: String —— 缩略图图片的主要颜色
- `secondaryColor`: String —— 缩略图图片的次要颜色
- `tertiaryColor`: String —— 缩略图图片的第三颜色
- `textColor`: String —— 保证与主要颜色有足够对比度的文本颜色
- `highContrastColor`: String —— 黑色或白色，取决于哪个与主要颜色有更高对比度

```javascript
function wallpaperMediaThumbnailListener(event) {
}
window.wallpaperRegisterMediaThumbnailListener(wallpaperMediaThumbnailListener);
```

#### MediaPlaybackListener

当用户开始、停止或暂停媒体播放时，将调用此事件函数。

**属性**：
- `state`: Number —— 媒体会话的当前状态。可以是三个值之一：
  - `window.wallpaperMediaIntegration.PLAYBACK_PLAYING` —— 媒体正在系统上播放
  - `window.wallpaperMediaIntegration.PLAYBACK_PAUSED` —— 媒体之前正在播放，但被用户（暂时）暂停
  - `window.wallpaperMediaIntegration.PLAYBACK_STOPPED` —— 媒体播放完全停止

```javascript
function wallpaperMediaPlaybackListener(event) {
}
window.wallpaperRegisterMediaPlaybackListener(wallpaperMediaPlaybackListener);
```

#### MediaTimelineListener

当播放媒体的当前时间更改时，将调用此事件函数。**请注意：**并非所有媒体播放器都支持此功能，请确保你的壁纸在此函数从未被调用时也能正常工作。

**属性**：
- `position`: Number —— 曲目的当前位置（秒）
- `duration`: Number —— 曲目的总时长（秒）

```javascript
function wallpaperMediaTimelineListener(event) {
}
window.wallpaperRegisterMediaTimelineListener(wallpaperMediaTimelineListener);
```

### 专辑封面和标题示例

以下示例将在页面上居中显示专辑封面以及标题和艺术家信息：

```html
<!DOCTYPE html>
<html lang="en">
	<head>
		<meta charset="utf-8">
		<style>
			body { margin:0; padding:0; }
			html, body { width:100%; height:100%; overflow:hidden; }
			.container { height:100vh; width:100vw; display: flex; justify-content: center; align-items: center; }
			.box { width: 40vw; height: 30vh; display: flex; }
			.textBox { display: flex; flex-direction: column; justify-content: center; }
			#albumCoverArt { margin-right: 5vw; }
			#trackTitle { font-size: 3vh; margin-bottom: 2vh; font-family: sans-serif; }
			#artist { font-size: 2vh; font-family: sans-serif; }
		</style>
	</head>
	<body>
		<div class="container">
			<div class="box">
				<img id="albumCoverArt"/>
				<div class="textBox">
					<div id="trackTitle" class="text"></div>
					<div id="artist" class="text"></div>
				</div>
			</div>
		</div>
		<script>
		let albumCoverArt = null;
		let trackTitle = null;
		let artist = null;
		function wallpaperMediaPropertiesListener(event) {
			trackTitle.textContent = event.title;
			artist.textContent = event.artist;
		}
		function wallpaperMediaThumbnailListener(event) {
			albumCoverArt.src = event.thumbnail;
			document.body.style['background-color'] = event.primaryColor;
			trackTitle.style.color = event.textColor;
			artist.style.color = event.textColor;
		}
		albumCoverArt = document.getElementById('albumCoverArt');
		trackTitle = document.getElementById('trackTitle');
		artist = document.getElementById('artist');
		window.wallpaperRegisterMediaPropertiesListener(wallpaperMediaPropertiesListener);
		window.wallpaperRegisterMediaThumbnailListener(wallpaperMediaThumbnailListener);
		</script>
	</body>
</html>
```

---

# 性能

## FPS 限制器

性能对于壁纸非常重要，如果你在 Web 壁纸中渲染任何复杂内容，应该使用 FPS 限制。本教程将解释如何读取和应用用户在 Wallpaper Engine 应用设置的 *Performance* 标签页中设置的 FPS 限制。我们建议你从那里应用 FPS 限制，而不是在壁纸上设置单独的 FPS 限制。

### 读取配置的 FPS 限制

你可以使用 `wallpaperPropertyListener` 获取用户配置的当前 FPS 限制。该事件在壁纸加载时以及用户更改通用应用配置时触发。

`wallpaperPropertyListener` 提供 `applyGeneralProperties` 事件。在 `properties` 参数中，你将找到 `fps` 值，其中包含作为数值的当前 FPS 限制：

```javascript
var wallpaperSettings = {
    fps: 0
};
window.wallpaperPropertyListener = {
    applyGeneralProperties: function(properties) {
        if (properties.fps) {
            wallpaperSettings.fps = properties.fps;
        }
    },
};
```

### 应用 FPS 限制

我们建议使用 `window.requestAnimationFrame` 绘制和更新内容。要限制 FPS，我们需要跟踪每帧之间经过的时间：

```javascript
var last = performance.now() / 1000;
var fpsThreshold = 0;
```

定义渲染函数 `run()`，在函数顶部实现 FPS 限制，底部放置壁纸绘制逻辑：

```javascript
function run() {
    // 保持动画运行
    window.requestAnimationFrame(run);
    // 计算自上次动画以来经过的时间
    var now = performance.now() / 1000;
    var dt = Math.min(now - last, 1);
    last = now;
    // 如果设置了 FPS 限制，在达到所需 FPS 时终止更新动画
    if (wallpaperSettings.fps > 0) {
        fpsThreshold += dt;
        if (fpsThreshold < 1.0 / wallpaperSettings.fps) {
            return;
        }
        fpsThreshold -= 1.0 / wallpaperSettings.fps;
    }
    // FPS 限制未达到，绘制动画！
    /** 在此放置壁纸动画逻辑！ **/
}
```

最后，在 `window.onload` 事件中调用 `window.requestAnimationFrame`：

```javascript
window.onload = function() {
    window.requestAnimationFrame(run);
};
```

由于函数将在 `run()` 函数的开头继续调用自身，动画将以提供的 FPS 限制无限期运行。

---

# RGB 设备

## RGB 硬件支持

Wallpaper Engine 允许你通过其 API 控制支持的 RGB 设备，并将壁纸与 LED 硬件同步。即使你不拥有任何或只拥有有限的兼容硬件，你也可以简单地使用模拟器。Corsair 的 iCUE 软件和 Razer 都提供了模拟你没有的设备的途径。

### 硬件模拟器设置（可选）

如果你想使用 RGB 硬件模拟器来测试你的 RGB 灯光在各种设备上的效果，我们推荐 Razer Chroma 模拟器。

首先，确保你安装了最新版本的 Razer Synapse 3。同样重要的是在 Razer Synapse 设置中安装 **Chroma Connect**：
- [下载 Razer Synapse 3](https://www.razer.com/synapse-3)

然后，前往 Razer 开发者门户安装最新版本的 Razer Chroma 模拟器：
- [Razer 开发者门户](https://developer.razer.com/works-with-chroma/download/)

安装后重启 Wallpaper Engine，确保在应用设置中启用了 LED 插件。通过使用 Wallpaper Engine 自带的任何标准壁纸（如 **Razer Bedroom**）验证模拟器是否正常工作。

### 初始化 LED 插件

在执行任何 LED 相关代码之前，你应该首先检查 LED 插件是否已加载，在此之前应跳过任何相关的 RGB 逻辑：

```javascript
var wallpaperSettings = {
    ledPlugin: false,
    cuePlugin: false
};
window.wallpaperPluginListener = {
    onPluginLoaded: function (name, version) {
        if (name === 'led') {
            // LED 插件已加载（适用于所有硬件）
            wallpaperSettings.ledPlugin = true;
        }
        if (name === 'cue') {
            // iCUE 特定插件已加载，仅在你想要使用额外的 iCUE 功能时需要
            wallpaperSettings.cuePlugin = true;
        }
    }
};
```

### 从 HTML Canvas 发送颜色数据

向 RGB 硬件发送颜色数据的主要方法是使用 `window.wpPlugins.led` 对象中的 `setAllDevicesByImageData` 函数：

```javascript
window.wpPlugins.led.setAllDevicesByImageData(encodedImageData, width, height);
```

该函数必须传入字符串形式的拼接 RGB 数据作为第一个参数，并且还需要参考图片的宽度和高度作为额外参数。推荐的创建此数据的方法是绘制 HTML canvas，然后将其转换为 RGB 数据字符串。

推荐的将 canvas 转换为 RGB 数据的方法：

```javascript
function getEncodedCanvasImageData(canvas) {
    var context = canvas.getContext('2d');
    var imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    var colorArray = [];
    for (var d = 0; d < imageData.data.length; d += 4) {
        var write = d / 4 * 3;
        colorArray[write] = imageData.data[d];
        colorArray[write + 1] = imageData.data[d + 1];
        colorArray[write + 2] = imageData.data[d + 2];
    }
    return String.fromCharCode.apply(null, colorArray);
}
// 仅在 LED 插件实际加载时执行此逻辑
if (wallpaperSettings.ledPlugin) {
    const canvas = document.getElementById('RGBCanvas');
    var encodedImageData = getEncodedCanvasImageData(canvas);
    window.wpPlugins.led.setAllDevicesByImageData(encodedImageData, canvas.width, canvas.height);
}
```

发送的颜色数据将自动由硬件驱动程序转换，并根据硬件制造商的配置应用于所有设备。建议选择适当大小的 canvas（100 x 20 像素）以最小化性能影响。

最佳实践是为 RGB 灯光包含某种空闲动画，以便在没有音频播放时 LED 硬件不会关闭。

## Corsair iCUE 额外功能

Wallpaper Engine 还允许你直接访问特定的 Corsair iCUE SDK 函数，但这特别限于 iCUE。对于绝大多数用例来说，这可能不是必需的，通用 RGB 硬件支持指南中的建议对大多数情况来说已经足够。

以下函数可通过 `window.cue` 对象使用。请确保首先通过 `window.wallpaperPluginListener` 检查 `cue` 插件是否已加载。

### getProtocolDetails

返回 iCUE SDK 的当前状态和版本。

```javascript
window.cue.getProtocolDetails(function (protocolDetails) {});
```

`protocolDetails` 成员：
- `sdkVersion`
- `serverVersion`
- `sdkProtocolVersion`
- `serverProtocolVersion`
- `breakingChanges`

### getDeviceCount

返回系统上识别的 iCUE 兼容设备数量。

```javascript
window.cue.getDeviceCount(function (deviceCount) {});
```

### getDeviceInfo

返回特定设备的所有信息。

```javascript
window.cue.getDeviceInfo(deviceIndex, function (deviceInfo) {});
```

`deviceInfo` 成员：
- `type`：参见 CUESDK.h 中的 CorsairDeviceType
- `model`：设备的可读名称
- `physicalLayout`：参见 CUESDK.h 中的 CorsairPhysicalLayout
- `logicalLayout`：参见 CUESDK.h 中的 CorsairLogicalLayout
- `ledCount`：可用 LED 数量
- `capsMask`：参见 CUESDK.h 中的 CorsairDeviceCaps

### getLedPositionsByDeviceIndex

返回指定设备的所有可用 LED 信息。

```javascript
window.cue.getLedPositionsByDeviceIndex(function (arrayOfLEDs) {});
```

`arrayOfLEDs` 数组中对象的成员：
- `ledId`：CorsairLedId（整数）
- `ledIdName`：CorsairLedId（字符串）
- `top`：值（毫米）
- `left`：值（毫米）
- `width`：值（毫米）
- `height`：值（毫米）

### setLedsColorsAsync

更新通过参数指定的所有 LED。

```javascript
window.cue.setLedsColorsAsync(arrayOfLEDColors);
```

`arrayOfLEDColors` 数组中对象的成员：
- `ledId`：CorsairLedId（整数）
- `r`
- `g`
- `b`

### setAllLedsColorsAsync

将给定设备的所有 LED 更新为一种特定颜色。

```javascript
window.cue.setAllLedsColorsAsync(deviceIndexOrArray, LEDColor);
```

`LEDColor` 成员：
- `r`
- `g`
- `b`

### setLedColorsByImageData

基于 RGB 位图更新给定设备的所有 LED。

```javascript
window.cue.setLedColorsByImageData(deviceIndexOrArray, encodedImageData, width, height);
```

此函数与通用 RGB 硬件支持指南中的 `window.wpPlugins.led.setAllDevicesByImageData` 非常相似。主要区别在于它要求你将特定的 `deviceIndexOrArray` 作为第一个参数。

---

# 调试

## Web 壁纸调试

如果你遇到任何意外行为或正在开发壁纸的过程中，使用 Web 浏览器的调试功能可能会很有用。Wallpaper Engine 的内部浏览器基于 *Chromium Embedded Framework (CEF)*，因此你应该使用 **Google Chrome** 进行调试。

设置调试非常简单。首先打开 Wallpaper Engine 设置，导航到 **General** 标签页。在底部附近，你会找到 **CEF devtools port** 选项，可以在其中输入你选择的 Web 端口。我们建议使用端口 8080，但如果你有任何工具已经使用该端口，可以尝试其他端口。

接下来，打开浏览器并在其中输入 `localhost:8080`（或你使用的任何端口代替 `8080`）。你将看到一个页面，其中概述了可以调试的文件。单击壁纸的主文件，你应该立即在浏览器中看到调试预览，就像浏览网页一样。你可以像调试其他应用程序一样使用检查工具，这对于读取控制台输出和调试构成壁纸的各个页面元素特别有用。请记住，每当你重新加载 Wallpaper Engine 中的壁纸时，总是需要返回到主 `localhost:8080` 页面，因为你正在调试的页面会在内部发生变化。

---

> 文档来源：https://docs.wallpaperengine.io/en/web/overview.html
> 版权归 Wallpaper Engine 所有。本文件仅供本地开发参考。
