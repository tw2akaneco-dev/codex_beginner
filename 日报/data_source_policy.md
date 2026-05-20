# 大类资产日报数据源优先级规范

本规范适用于早报、晚报、周报、月报、年报。目标是让每次报告按相对固定的数据源顺序抓取，减少口径漂移；抓不到时有清晰降级路径；仍抓不到时必须写“未获取”或“数据缺失”，不要编造。

## 一、总原则

1. **同一指标优先使用同一主源。** 只有主源无法访问、数据明显过期、字段缺失或数值异常时，才切换备用源。
2. **官方源优先于媒体源，交易/行情源优先于新闻转述。** 政策和宏观数据优先官方；市场实时价格优先行情源；新闻解释优先 Reuters/AP/官方公告。
3. **数据和新闻分开取证。** 行情数值不要只来自新闻段落，新闻逻辑不要只来自行情页面。
4. **不混用不同时间戳口径。** 最新值、日变动、周变动、月初以来、年初以来应尽量来自同一源或同一时间点；若混用，必须在“数据源与时间”写明。
5. **时效阈值：**
   - 早报/晚报实时市场数据：优先使用最近 12 小时内或最近一个交易时段数据。
   - 日线收盘数据：可使用最近一个完整交易日。
   - 周报：可使用最近 3 个交易日内的周度数据或周五收盘。
   - 月报/年报：可使用最后一个可得交易日，并说明是否非最终收盘。
6. **本地缓存只作辅助。** `/Users/px/Desktop/cursor_beginner/dashboard/market_data_cache.json` 可用于交叉验证和临时兜底，但若时间戳过期、数值明显异常或与主源冲突，必须降级为“历史参考”，不能作为主数据。
7. **异常数值必须二次验证。** 股指单日超过 2%、汇率超过 0.5%、商品超过 3%、10Y 美债超过 10bp、VIX 超过 25/30、USD/CNH 突破关键心理位时，至少尝试用第二来源交叉验证。
8. **低置信度来源要明说。** 论坛、聚合页、无法确认时间戳的网页、AI摘要页不能作为高置信度行情源；除非完全没有替代，否则不用。

## 二、市场数据优先级

| 数据类型 | 指标范围 | 第一优先级 | 第二优先级 | 第三优先级/兜底 | 备注 |
| --- | --- | --- | --- | --- | --- |
| A股指数 | 上证、沪深300、创业板、科创50、行业指数 | 东方财富 | 交易所官网、同花顺、新浪财经 | Yahoo Finance、Investing、Reuters/财联社新闻转述 | 东方财富优先，因为国内指数字段和中文市场覆盖更稳定。 |
| 港股指数 | 恒生、恒生科技、国企指数、港股行业 | 东方财富、港交所/恒生指数公司 | AASTOCKS、Yahoo Finance | Investing、Reuters/财联社新闻转述 | 若恒生科技收盘点位取不到，写“未获取”，不要用早盘点位冒充收盘。 |
| 日本/韩国/亚洲股指 | 日经225、TOPIX、KOSPI、台湾加权等 | Yahoo Finance | Investing、交易所官网 | Reuters/MarketScreener/主流新闻转述 | 亚洲股指优先统一用 Yahoo，便于比较日变动。 |
| 欧洲股指 | Stoxx 600、DAX、FTSE 100、CAC 40 | Yahoo Finance | Investing、交易所官网 | Reuters/MarketScreener | 若只有欧洲早盘或盘中数据，必须标注“盘中/早盘”。 |
| 美股指数与期货 | S&P 500、Nasdaq、Dow、Russell、三大期货 | Yahoo Finance、CME | Investing、MarketWatch、CNBC | Reuters/MarketScreener | 期货和现货不要混写；盘前必须写 futures。 |
| 汇率 | DXY、USD/CNH、USD/CNY、USD/JPY、USD/KRW、EUR/USD、GBP/USD | Yahoo Finance、东方财富（人民币） | Reuters、Investing、Xe | ExchangeRate-API、CurrencyLive | ExchangeRate-API 不可用于真实 DXY；DXY 优先 Yahoo/ICE口径或可靠 DXY 专站。 |
| 人民币中间价 | USD/CNY中间价、CFETS信息 | 中国外汇交易中心、PBOC授权发布 | 中国新闻网/新华社/财联社转述官方数据 | Reuters | 中间价是政策信号，优先官方或官方授权转述。 |
| 美国利率 | 2Y、10Y、30Y、收益率曲线 | 美国财政部 | FRED、CNBC、Yahoo Finance | Investing、MarketWatch | 美国财政部适合日线官方数；盘中变化可用CNBC/Yahoo并标注盘中。 |
| 中国利率 | 中国10Y国债、政策利率、LPR、MLF | 中国债券信息网、全国银行间同业拆借中心、PBOC | Trading Economics、Reuters | Investing、东方财富债券页 | 中国10Y若无法取得当日收盘，必须写“待确认/未获取”。 |
| 商品 | Brent、WTI、黄金、白银、铜、天然气 | Yahoo Finance、CME/ICE | Investing、MarketWatch | Reuters/FXStreet/主流新闻转述 | ICE/CME官方更权威，但可访问性不稳定；Yahoo适合统一表格。 |
| 风险指标 | VIX、MOVE、信用利差、高收益OAS | CBOE、ICE/BofA、FRED | Yahoo Finance、YCharts | Investing、Saxo/Reuters新闻转述 | 信用利差若只有滞后值，状态写“数据滞后”。 |
| 加密资产（如使用） | BTC、ETH | CoinMarketCap、CoinGecko | Yahoo Finance | TradingView、Reuters | 目前日报非必选项，除非新闻主线需要。 |

## 三、宏观、政策和事件优先级

| 数据/新闻类型 | 第一优先级 | 第二优先级 | 第三优先级/兜底 | 备注 |
| --- | --- | --- | --- | --- |
| 中国宏观数据 | 国家统计局、PBOC、财政部、海关总署、国家发改委 | 中国政府网、新华社、中国新闻网官方转述 | Reuters、财联社、华尔街见闻 | 官方数据发布日期和口径必须写清楚。 |
| 中国货币/财政/地产政策 | PBOC、财政部、住建部、国务院、交易所公告 | 新华社、中国政府网 | Reuters、财联社、华尔街见闻 | 政策消息没有官方出处时标“待确认”。 |
| 美国宏观数据 | BLS、BEA、Census、ISM、Federal Reserve、US Treasury | FRED、官方新闻稿 | Reuters、AP、CNBC、MarketWatch | CPI/PCE/非农等高影响数据优先官方。 |
| 美联储 | Federal Reserve官网、FOMC声明、官员原文 | Reuters、AP | CNBC、WSJ、FT | 若引用讲话，说明讲话对象和时间。 |
| 欧洲/日本/韩国政策 | ECB、BoE、BoJ、韩国央行、各国统计局 | 官方新闻稿/统计局 | Reuters、AP、Nikkei、CNBC | 政策利率和CPI优先官方。 |
| 地缘政治 | 官方声明、联合国/政府公告 | Reuters、AP | FT、WSJ、Bloomberg、CNBC | 地缘消息要特别注意“待确认”。 |
| 能源与OPEC | OPEC、IEA、EIA、API（非官方库存） | Reuters、AP | Investing、OilPrice、MarketWatch | API库存必须标注非官方。 |
| 企业/行业事件 | 公司IR、交易所公告、SEC文件 | Reuters、AP、公司财报电话会 | CNBC、Yahoo Finance、MarketWatch | Nvidia、Apple等影响指数的大公司优先看公司披露或Reuters。 |
| 经济日历 | 官方机构日历、Fed日历、EIA日历 | Trading Economics | Investing、MarketWatch、Kiplinger | 不确定日历必须标“待确认”。 |

## 四、报告生成时的固定抓取流程

1. **先读本规范和任务模板。** 每次生成报告前必须读取本文件和对应任务说明。
2. **读取本地资料。** 包括研究稿、复盘稿、知识库和 `market_data_cache.json`，但本地缓存不能替代最新源。
3. **按资产类别逐项抓取主源。** 优先保证核心仪表盘里的必需指标。
4. **主源失败后按表格顺序降级。** 每次降级都要在数据源表中体现实际使用来源。
5. **异常项目做二次验证。** 若验证失败，保留数值但标“待确认”；若来源冲突很大，写“数据口径分歧”。
6. **生成“数据源与可信度说明”。** 表格必须列实际使用源、备用尝试情况、是否成功、可信度和备注。
7. **缺失项保持缺失。** 没有可靠来源时写“未获取/数据缺失”，不要用推测值、旧缓存或新闻描述补点位。

## 五、置信度标签建议

| 置信度 | 使用条件 | 报告写法 |
| --- | --- | --- |
| 高 | 官方源、交易所源、主流行情源且时间戳清晰，或两家可靠来源一致 | “置信度：高” |
| 中高 | Reuters/AP/主流财经媒体转述官方或行情，时间清晰 | “置信度：中高” |
| 中 | 聚合行情源、盘中数据、单一可靠媒体，或主源不可得但备用源合理 | “置信度：中” |
| 中低 | 时间戳不完整、口径可能不同、只适合方向判断 | “待确认，置信度：中低” |
| 低 | 论坛、社媒、无法确认来源的聚合页 | 原则上不用；若使用必须说明“低置信度，仅作参考” |

## 六、禁止事项

- 不用 ExchangeRate-API 的合成结果替代 ICE/Yahoo 口径 DXY。
- 不用过期本地缓存冒充当日最新行情。
- 不把期货点位写成现货指数点位。
- 不把早盘、盘中、盘后数据写成收盘数据。
- 不用新闻里的“上涨/下跌”推导未给出的具体点位。
- 不为了填满周变动、月初以来、年初以来而自行估算；无法可靠取得就写“未获取”。
