# VALTI

VALTI 是一个基于 Cloudflare Workers 的 15 题人格测试项目：以 MBTI 恶搞版为骨架，把结果映射成 16 种《无畏契约》特工人格。

## 特性

- 15 题固定结构，每次从 15 个题位中各抽 1 题
- 题库扩展为 500 题，按固定题位均匀分布以尽量减少重复
- 每道题都有稳定唯一的 MD5 标识
- 答题页左下角会以低存在感显示当前题目的 MD5，方便定位与排查
- 结果固定映射为 16 种《无畏契约》特工人格
- 前端静态资源托管在 `main/`
- 前端拆分为 `index.html + styles.css + app.js`
- 支持手动明暗模式切换，仅在本地保存主题偏好
- 浏览器会在本地保存最近一段已见题目的 MD5，用于尽量减少重复题；不随请求上传
- Worker 负责题库、脱敏题目池、计分和结果返回
- 首页滚动图与结果图支持直接读取 `main/assets/agents/` 中的特工 PNG，缺图时自动回退到内联占位 SVG

## 项目结构

```text
.
├── main/                 # 前端静态资源
│   ├── index.html        # 页面结构
│   ├── styles.css        # 页面样式
│   ├── app.js            # 前端交互逻辑
│   └── assets/
│       ├── favicon.png
│       └── agents/
├── worker.js             # Cloudflare Worker API
├── wrangler.jsonc        # Workers 配置
├── README.md             # 项目说明、题库与结果逻辑
├── LICENSE               # MIT License
└── TEMLATE/              # 参考模板，不参与线上部署
```

## 本地开发

```bash
wrangler dev
```

## 部署

```bash
wrangler deploy
```

## 测试逻辑

### 维度说明

每道题的选项对应一个 MBTI 维度：

| 维度 | 含义 |
|------|------|
| E / I | 外向 / 内向 |
| S / N | 实感（具体）/ 直觉（联想） |
| T / F | 理性 / 感性 |
| J / P | 计划 / 随性 |

最后 3 个题位为决胜题，分别放大 E/I、S/N、T/F，服务端按 `weight: 2` 记分。

### 题库结构

题库不直接写在 `index.html` 中，而是由 Cloudflare Workers 维护，并在开始测试时返回每个题位的候选题池。

当前前端接口路径使用：

- `GET /api/start`
- `POST /api/finish`

其中 `/api/start` 不接收客户端上传的已见题历史，而是返回：

- `slotOrder`
- `slotPools`
- `bankSize`
- `idFormat`

浏览器会根据本地保存的已见题 MD5 历史，优先从各题位候选池里选择未见题；若某个题位已全部见过，则回退到该题位中最久没见过的题。

当前采用**固定槽位随机**：

- E/I：4 个题位
- S/N：4 个题位
- T/F：4 个题位
- J/P：3 个题位

每个题位配置多道候选题，Worker 每次返回各题位候选池，前端本地从每个题位各取 1 题，组成一轮完整测试。

#### 当前 15 个题位

| 题序 | 槽位 | 维度 | 决胜题 |
|---|---|---|---|
| 1 | EI_1 | E / I | 否 |
| 2 | SN_1 | S / N | 否 |
| 3 | TF_1 | T / F | 否 |
| 4 | JP_1 | J / P | 否 |
| 5 | EI_2 | E / I | 否 |
| 6 | SN_2 | S / N | 否 |
| 7 | TF_2 | T / F | 否 |
| 8 | JP_2 | J / P | 否 |
| 9 | EI_3 | E / I | 否 |
| 10 | SN_3 | S / N | 否 |
| 11 | TF_3 | T / F | 否 |
| 12 | JP_3 | J / P | 否 |
| 13 | EI_4 | E / I | 是，`weight: 2` |
| 14 | SN_4 | S / N | 是，`weight: 2` |
| 15 | TF_4 | T / F | 是，`weight: 2` |

### 出题原则

- 题目围绕《无畏契约》排位语境展开，重点放在沟通、默认、残局、补位、博弈、心态、节奏和整活气质
- 不把题库直接暴露在前端源码里
- 通过扩展同槽位候选题，实现“每次测试题目不同或尽量不重复”
- 不使用 AI 动态出题；题库由人工维护，Worker 负责抽题和计分
- 题目公开 ID 使用稳定 MD5，便于本地去重、定位与排查

### 结果逻辑

```js
count = { E:0, I:0, S:0, N:0, T:0, F:0, J:0, P:0 }

// 前12题按 1 分记；13~15 题按 weight: 2 记

e = count.E >= count.I ? "E" : "I"
s = count.S >= count.N ? "S" : "N"
t = count.T >= count.F ? "T" : "F"
j = count.J >= count.P ? "J" : "P"

type = e + s + t + j
```

Workers 根据计算出的 MBTI，映射到固定的 16 个特工结果。

### 16种结果

| MBTI | 结果名 | 特工 key |
|------|--------|---------|
| ENTJ | 把全队频道当自己指挥台的炼狱 | brimstone |
| ENTP | 下一句永远能把全队计划拐去新分支的夜露 | yoru |
| ENFJ | 一边开导队友情绪一边把残局也顺手捞回来的斯凯 | skye |
| ENFP | 看见新套路和新缝就想先试了再说的盖可 | gekko |
| ESTJ | 把起枪和站位过成排班表的奇乐 | killjoy |
| ESTP | 把对枪和冲点都当游乐项目在玩的捷风 | jett |
| ESFJ | 只要队里有人快碎了就会自然接住的贤者 | sage |
| ESFP | 人还没拉出去，气氛已经先冲到点里的雷兹 | raze |
| INTJ | 安静站后排但脑子已经把三层博弈算完的蝰蛇 | viper |
| INTP | 蹲在角落里研究 timing、信息差和怪点位的零 | cypher |
| INFJ | 不爱抢话却总能提前读到队友情绪和局势走向的幽影 | omen |
| INFP | 看起来温和随缘，实际上节奏感和理想画面都很重的星礈 | astra |
| ISTJ | 记点、架枪、补位和纪律性都像写进肌肉里的猎枭 | sova |
| ISTP | 懒得多说但手上永远比嘴先到位的尚勃勒 | chamber |
| ISFJ | 总能把位置、技能和队友需求一起顾上的海神 | harbor |
| ISFP | 平时话不算多，但出手一定要顺着自己手感和审美来的芮娜 | reyna |

### 当前部署分层

- `main/index.html`：页面 DOM 结构与静态容器
- `main/styles.css`：页面样式、主题变量与动效
- `main/app.js`：公告门禁、主题切换、首页滚动图、拉题、答题、结果渲染
- `worker.js`：题库维护、题目候选池返回、服务端判分与结果映射

## 致谢

- 本项目在玩法方向与早期参考上，致谢 [diggtoli-stack/DogTi](https://github.com/diggtoli-stack/DogTi)
- 项目结构与早期页面组织参考了 [L-aros/Cat-TI](https://github.com/L-aros/Cat-TI)

## 开源协议

MIT
