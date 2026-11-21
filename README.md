# 视觉素材图鉴

Peiiii 的个人视频包装参考库。按风格、视觉特效、动效手法和白模动作挑选素材，把可复制的配置交给 AI。风格组合支持从 3–5 套风格生成 3–10 个配对，再叠加自己的配色与 IP。504 项视觉特效每张卡均可直接看图和复制提示词，覆盖 454 张来源示例与 50 张本站制作的演示和示意。目录支持快捷筛选，滚动到底自动追加。

- [线上站点](https://visual-library.peiiii.com/)

## 本地打开

需要 Node.js 22.12+。执行 `npm ci`，再执行 `npm run dev`，打开终端显示的地址。运行 `npm run build` 会验证目录及数据，再输出 `dist/`；运行 `npm run preview` 可预览正式构建。

## 维护自己的条目

- **新增风格。** 复制一条 `data/styles.json` 的记录，更换唯一英文 `id`，改中文名、英文名、分类、色板、适合的段落和提示词。自己的图放进 `public/samples/`，在条目中加 `"image": "/samples/文件名.webp"`。已有 `preview` 字段是内置样张样式；自带图片时优先使用图片。A、B、C 分别表示换题即用、换题需改、特定题材。
- **新增动作。** 复制 `data/white-models.json` 的条目，保留可筛选的日期、关系、类型、适用场景和动作时序。新动作的 Canvas 画法在 `src/preview.js` 的 `drawWhite` 接到对应 ID。画法的皮肤参数控制外观，动作数据控制位置和节奏。
- **更新参考资料。** LetzAI 目录位于 `data/atlas.json`，只保存名称、组别和公开链接。打开详情或点击卡片上的复制按钮时，本站只读接口会向 LetzAI 读取所选条目。新增特效时，同时在 `public/atlas-media/` 放置该条目同名 WebP，并在 `data/atlas-media.json` 登记。新增有现成许可的示例时，在 `data/atlas-media.json` 或 `data/atlas-videos.json` 同时记录作者、许可、原链接及文件。Motion Prompt 保留原片所用的 192 项版本，简中和英文数据位于 `data/motion-prompt.json`，原始 Canvas 包在 `public/motion-prompt/`。
- **发布。** 运行 `npm run build`，将 `wrangler.jsonc` 的 Worker 名称和域名改为自己的配置，再在已登录的 Cloudflare 账号下运行 `wrangler deploy`。个人素材放入公开站之前核对来源与可公开性。未发布的参考和本地分析文件可留在 `.local/`。

## 来源

- [一页枝鸥的原片](https://www.douyin.com/video/7708581319843794191)提供分类和制作工作流。站内风格配置与白模动作采用本项目的重述和示范。生成的样张为本项目原创示例。
- [LetzAI Atlas of Visual Effects](https://atlas.letz.ai/)，[公开接口](https://atlas.letz.ai/agents)和[图像权利说明](https://atlas.letz.ai/sources)。有再用许可的封面在条目详情标明来源。其他原始图像及视频由各条目的官方页提供。
- [Motion Prompt，Shohei Ohtaki](https://github.com/showheyohtaki/motion-prompt/tree/7819d3879eb7)，[MIT 许可](public/motion-prompt/LICENSE)及[第三方声明](public/motion-prompt/THIRD-PARTY-NOTICES.md)。站内样张使用该提交的原始 Canvas 包，元数据保留简中/英文。
- [Lemo-Opuscar，Lemomo (LemoLab)](https://github.com/lemomo-ai/lemo-opuscar)是片中部分风格的公开来源。站内链接到有关风格页，文档、源码和影片的许可各见[上游说明](https://github.com/lemomo-ai/lemo-opuscar/blob/main/LICENSE)。

## 许可证

本项目自有代码、配置和自制演示采用 [MIT](LICENSE)。Motion Prompt 采用仓库中随附的 [MIT 许可](public/motion-prompt/LICENSE)和[第三方声明](public/motion-prompt/THIRD-PARTY-NOTICES.md)。其余第三方图像和视频沿用 [图像来源清单](data/atlas-media.json)及 [视频来源清单](data/atlas-videos.json)记录的作者、来源和许可。
