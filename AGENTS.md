# 空气键盘 (Air Keyboard)

空中手势钢琴。戒指选键，手杖弹奏。Web Audio 合成 + Capacitor 原生包装。

## 目标平台

| 平台 | 方式 | 产出 |
|------|------|------|
| 🍎 iOS | Capacitor → Xcode | IPA |
| 🤖 Android | Capacitor → Gradle | APK |
| ⌚ 手表 | 触屏+窄屏 | 同 APK |
| 👓 智能眼镜 | 窄 FOV | 同 APK |

## 玩法

- 戒指左右选键，上下换八度，甩动弹奏
- 手杖挥动弹奏，敲击止音
- 音阶：大调 / 五声 / 蓝调 / 半音

## 技术栈

- Web Audio API 钢琴合成
- DeviceOrientation / DeviceMotion 可穿戴输入
- Capacitor 原生包装

## Harness / Loop（助手）

- 遵循根 `/Users/skat/AGENTS.md`：**Harness Engineering** + **Loop Engineering**
- Guide = 本文件；Sensor = 下方验证命令；同类失误第二次须沉淀规则或测试（棘轮）
- 开干前写清 **Done**；每切片过验证环；显式停止（成功 / 上限 / 无进展 / 人审）
- 详解：`docs/HARNESS_ENGINEERING.md`、`docs/LOOP_ENGINEERING.md`
