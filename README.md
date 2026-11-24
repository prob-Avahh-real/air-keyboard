# 空气键盘 Air Keyboard

用空中手势弹钢琴：智能戒指选键/换八度，智能手杖弹奏。Capacitor 打包为手机 App，并适配手表小屏。

## 功能

- **音阶**：大调 / 五声 / 蓝调 / 半音
- **Web Audio 合成**：软槌击 + 泛音衰减的钢琴感音色
- **可穿戴输入**
  - 戒指：左右切换琴键 · 上下切换八度 · 甩动弹奏
  - 手杖：挥动弹奏（力度跟随） · 敲击止音
- **触控兜底**：点按琴键 / 弹奏按钮
- **手表适配**：`max-width: 280px` 或 `max-height: 300px` 紧凑布局
- **眼镜适配**：窄 FOV 布局

## 项目结构

```
air-keyboard/
├── protocol/air-keyboard.json   # 手势与音阶协议
└── mobile/
    ├── index.html
    ├── capacitor.config.json
    ├── package.json
    ├── scripts/build-web.js
    ├── src/
    │   ├── app.js              # UI 与手势路由
    │   ├── audio-engine.js     # Web Audio 钢琴
    │   ├── notes.js            # 音阶 / MIDI
    │   └── wearable-input.js   # 戒指 / 手杖
    └── test/
```

## 快速开始

```bash
cd mobile
npm install
npm run build          # → www/
npm test
```

浏览器预览：

```bash
npx serve www
```

## 打包 Android / iOS

```bash
cd mobile
npm install
npx cap add android    # 或 ios
npm run mobile:android
# 或 npm run mobile:ios
```

日常：改 `src/` 或 `index.html` → `npm run build` → `npx cap sync android` → 真机运行。

## 手势对照

| 设备 | 动作 | 效果 |
|------|------|------|
| 戒指 | 左右倾 > 5° | 上一/下一琴键 |
| 戒指 | 上下倾 > 5° | 八度 ±1 |
| 戒指 | 甩动 > 20° | 弹奏当前键 |
| 手杖 | 挥动 > 3 | 弹奏（力度跟随） |
| 手杖 | 加速度尖峰 > 8 | 止音 |

桌面调试：`←` `→` 选键，`↑` `↓` 八度，空格弹奏，`[` `]` 切音阶，`M` 静音，`Esc` 止音。
