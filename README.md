# 视觉素材图鉴

Peiiii 的个人视频包装参考库。按风格、视觉特效、动效手法和白模动作挑选素材，把可复制的配置交给 AI。风格组合支持从 3–5 套风格生成 3–10 个配对，再叠加自己的配色与 IP。504 项视觉特效每张卡均可直接看图和复制提示词，覆盖 454 张来源示例与 50 张本站制作的演示和示意。目录支持快捷筛选，滚动到底自动追加。

动效手法收齐 Motion Prompt 240 项和 10 个系列。风格库可切换到 Lemo-Opuscar 的 99 项公开参考。白模动作包括对照原片的 7 个案例与本站原创 48 个案例，均可播放、换画幅、换皮肤和复制配置。

- [线上站点](https://visual-library.peiiii.com/)

## 本地打开

需要 Node.js 22.12+。执行 `npm ci`，再执行 `npm run dev`，打开终端显示的地址。运行 `npm run build` 会验证目录及数据，再输出 `dist/`；运行 `npm run preview` 可预览正式构建。

## 维护自己的条目

- **新增风格。** 复制一条 `data/styles.json` 的记录，更换唯一英文 `id`，改中文名、英文名、分类、色板、适合的段落和提示词。自己的图放进 `public/samples/`，在条目中加 `"image": "/samples/文件名.webp"`。已有 `preview` 字段是内置样张样式；自带图片时优先使用图片。A、B、C 分别表示换题即用、换题需改、特定题材。
- **新增动作。** `data/white-models.json` 记录日期、关系、用途、口播例句和时序。`choreography` 指向 `src/white-animations.js` 的动作和变体。原片案例的画法在 `src/preview.js`。画幅和皮肤通过预览统一切换。
- **更新参考资料。** LetzAI 的名称、组别和公开链接位于 `data/atlas.json`。打开详情或复制提示词时，通过只读接口读取原条目。新增示例，在 `data/atlas-media.json` 或 `data/atlas-videos.json` 同时记录作者、许可、原链接及文件。Motion Prompt 的版本、条目和系列位于 `data/motion-prompt.json`，Canvas 包和素材位于 `public/motion-prompt/`。Lemo-Opuscar 的名称、样片链接及封面出处位于 `data/opuscar.json`。
- **核对上游。** 运行 `npm run audit:sources`，逐项对照 LetzAI、Motion Prompt 和 Lemo-Opuscar 的当前公开条目，发现新增、移除或 Motion Prompt 版本变化时会报出差异。
- **更新封面。** 替换或新增 WebP 后，用装有 Pillow 的 Python 运行 `python3 scripts/build_cover_previews.py`，刷新列表缩略图和内嵌低清预览。详情保留原图。
- **发布。** 运行 `npm run build`，将 `wrangler.jsonc` 的 Worker 名称和域名改为自己的配置，再在已登录的 Cloudflare 账号下运行 `wrangler deploy`。个人素材放入公开站之前核对来源与可公开性。未发布的参考和本地分析文件可留在 `.local/`。

## 来源

- [一页枝鸥的原片](https://www.douyin.com/video/7708581319843794191)提供分类和制作工作流。站内风格配置与白模动作采用本项目的重述和示范。生成的样张为本项目原创示例。
- [LetzAI Atlas of Visual Effects](https://atlas.letz.ai/)，[公开接口](https://atlas.letz.ai/agents)和[图像权利说明](https://atlas.letz.ai/sources)。有再用许可的封面在条目详情标明来源。其他原始图像及视频由各条目的官方页提供。
- [Motion Prompt，Shohei Ohtaki](https://github.com/showheyohtaki/motion-prompt/tree/683ecca0548a1754ada141d10dc3a009d4c59bef)，[MIT 许可](public/motion-prompt/LICENSE)及[第三方声明](public/motion-prompt/THIRD-PARTY-NOTICES.md)。使用源 Canvas 包及样张图像。名称、释义、示例提示词保留简中及英文，详细规格提供英文原文。
- [Lemo-Opuscar，Lemomo (LemoLab)](https://lemomo-ai.github.io/lemo-opuscar/zh/)，[上游许可](https://github.com/lemomo-ai/lemo-opuscar/blob/f9e204293930952b61ba921cd8944d05f121beee/LICENSE)。图鉴使用按比例缩放的样片封面或工位图，详情分别标注出处和 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) 许可。Memphis Diorama 由 EianLu 创作，Crayon World 3D 由 2nd1st 创作。涉及独立第三方条款的样片通过原页查看。

## 许可证

本项目自有代码、配置和自制演示采用 [MIT](LICENSE)。Motion Prompt 采用仓库中随附的 [MIT 许可](public/motion-prompt/LICENSE)和[第三方声明](public/motion-prompt/THIRD-PARTY-NOTICES.md)。其余第三方图像和视频沿用 [图像来源清单](data/atlas-media.json)及 [视频来源清单](data/atlas-videos.json)记录的作者、来源和许可。
