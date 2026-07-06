export type BusinessLine = '韩国' | '沙特' | '马来' | '越南' | '其他'

export const BUSINESS_LINES: BusinessLine[] = ['韩国', '沙特', '马来', '越南', '其他']

// 业务线 -> 本地币种
export const LINE_CURRENCY: Record<BusinessLine, { code: string; label: string }> = {
  韩国: { code: 'KRW', label: '韩元 (KRW)' },
  沙特: { code: 'SAR', label: '沙特里亚尔 (SAR)' },
  马来: { code: 'MYR', label: '马来西亚林吉特 (MYR)' },
  越南: { code: 'VND', label: '越南盾 (VND)' },
  其他: { code: 'USD', label: '美元 (USD)' },
}

export const COUNTRY_CODE: Record<BusinessLine, string> = {
  韩国: '+82',
  沙特: '+966',
  马来: '+60',
  越南: '+84',
  其他: '+1',
}

// 渠道自定义参数（暂支持两个）
export type ChannelParams = {
  param1?: string
  param2?: string
}

export type ChannelLevelNode = {
  id: string
  name: string
  level: 1 | 2 | 3
  code?: string // 渠道 code（在该级渠道下生成）
  params?: ChannelParams // 渠道参数（在末级渠道上填写）
  children: ChannelLevelNode[]
}

export type ChannelType = {
  id: string
  name: string // 自然流量 / landingpage / KOL ...
  children: ChannelLevelNode[]
}

// 业务线（最顶层）：韩国 / 沙特 / 泰国 / 越南 / 印尼 ...，下含渠道类型
export type ChannelLine = {
  id: string
  name: string
  children: ChannelType[]
}

export type UserStatus = '注册' | '付费' | '付费逾期'

export const USER_STATUSES: UserStatus[] = ['注册', '付费', '付费逾期']

export type LoginMethod = '谷歌邮箱' | 'Facebook' | 'kakao' | '手机号' | 'AppID'

export const LOGIN_METHODS: LoginMethod[] = ['谷歌邮箱', 'Facebook', 'kakao', '手机号', 'AppID']

// 是否带手机号（谷歌邮箱 / Facebook / AppID 无手机号）
export const METHOD_HAS_PHONE: Record<LoginMethod, boolean> = {
  谷歌邮箱: false,
  Facebook: false,
  kakao: true,
  手机号: true,
  AppID: false,
}

// 应用商店渠道（一期：无渠道体系，仅区分应用商店来源）
export type AppChannel = 'App Store' | 'Google Play'
export const APP_CHANNELS: AppChannel[] = ['App Store', 'Google Play']

export type AgeGroup = '3-5' | '6-8' | '9-12' | '13-17' | '18+'
export const AGE_GROUPS: AgeGroup[] = ['3-5', '6-8', '9-12', '13-17', '18+']

// 用户类型：正式用户 / 测试用户
export type UserType = '正式用户' | '测试用户'
export const USER_TYPES: UserType[] = ['正式用户', '测试用户']

// 单个字段的修改前后对比
export type StudentFieldChange = {
  field: string // 字段名（展示文案）
  before: string // 修改前
  after: string // 修改后
}

// 学生信息修改历史：每次操作的时间、行为（i18n key）、变更对比、修改人
export type StudentEditLog = {
  time: string
  action: string // i18n key，如 'user.hist.edit'
  detail?: string // 变更明细（旧数据兼容，纯文本）
  changes?: StudentFieldChange[] // 修改前后对比
  modifier: string
}

export type Student = {
  studentId: string
  name: string
  localName?: string
  userType: UserType
  gender?: '男' | '女' | '其他'
  birthday?: string // YYYY-MM-DD
  ageGroup?: AgeGroup
  loginMethod: LoginMethod
  account: string // 登录账号：邮箱 / FB / kakao ID / AppID / 手机号
  phone?: string // 仅 kakao / 手机号 方式有
  businessLine: BusinessLine
  registerChannel: string
  countryCode: string
  channelCode: string
  country?: string // 注册时 IP 对应的国家（一期用户中心）
  appChannel?: AppChannel // 注册渠道（一期：App Store / Google Play）
  registerTime: string // UTC
  status: UserStatus
  expireTime?: string // 到期时间
  lastModifier?: string // 最近修改人
  editHistory?: StudentEditLog[] // 修改历史（时间 / 行为 / 修改人）
  // ---- 销售中心（线索跟进）----
  channelSource?: string // 渠道来源（投放/KOL 归因标识）
  salesOwner?: string // 领取人（销售）
  salesProgress?: SalesProgress // 跟进进度（仅销售中心线索）
  salesLatestNote?: string // 最新备注
  salesNextFollow?: string // 下次跟进时间
  salesUpdatedAt?: string // 最后更新时间
  salesHistory?: SalesFollowLog[] // 跟进记录
}

// 销售跟进进度（线索在销售中心的状态；转「已体验/已付费」时改写 status 并离开销售中心）
export type SalesProgress = '待领取' | '跟进中' | '暂不跟进'

export type SalesFollowLog = {
  progress: string
  note: string
  time: string
  owner: string
}

// ---------- 外呼系统（点击拨号 + 通话记录回写） ----------
// 通话方向：目前以坐席主动外呼为主，保留呼入以便后续扩展
export type CallDirection = '呼出' | '呼入'

// 通话结果（挂断后由坐席选择，作为回写的核心结论）
export type CallResult = '已接通' | '未接通' | '无人接听' | '占线' | '关机停机' | '空号' | '拒接'

export const CALL_RESULTS: CallResult[] = ['已接通', '未接通', '无人接听', '占线', '关机停机', '空号', '拒接']

// 已接通的结果（用于判断是否有通话时长 / 是否算有效触达）
export const CALL_CONNECTED_RESULTS: CallResult[] = ['已接通']

// 一条通话记录：外呼系统回写到 CRM 客户档案的最小单元
export type CallRecord = {
  id: string
  studentId: string
  phone: string
  direction: CallDirection
  result: CallResult
  agent: string // 外呼坐席（当前账号邮箱）
  startTime: string // 起呼时间
  duration: number // 通话时长（秒），未接通为 0
  note?: string // 通话小结
  recordingUrl?: string // 录音链接（Mock，仅演示）
}

export type OrderStatus = '待支付' | '已支付' | '已退款' | '已取消'

export type Order = {
  orderId: string
  productName: string
  studentId: string
  userStatus: UserStatus
  orderStatus: OrderStatus
  originalPrice: number
  paidAmount: number
  payMethod: 'App Store' | 'Google Play' | 'Stripe' | 'PayPal'
  currency: string
  paidTime?: string
  validUntil?: string // 有效期到期时间
}

export type PackageStatus = '上架' | '下架'

export type CoursePackage = {
  id: string
  businessLine: BusinessLine
  name: string
  currency: string
  price: number
  validStart: string // 有效期开始时间 YYYY-MM-DD HH:mm:ss
  validEnd: string // 有效期结束时间 YYYY-MM-DD HH:mm:ss
  creator: string
  status: PackageStatus
  createdAt: string
}

// 落地页：一键生成投放链接，关联渠道、商品包、优惠券
export type LandingPage = {
  id: string
  businessLine: string
  channelCode: string
  channelName?: string
  param1?: string // 渠道参数1（生成时带入链接）
  param2?: string // 渠道参数2
  packageId?: string
  packageName?: string
  couponId?: string
  couponCode?: string
  validFrom?: string
  validUntil?: string
  url: string
  creator: string
  createdAt: string
}

// ---------- 角色权限（RBAC） ----------
// 权限级别：无权限 / 只读 / 可操作
export type PermLevel = 'none' | 'view' | 'operate'

// 数据权限：全部业务线 / 指定业务线
export type DataScope = 'all' | 'line'

// 受权限管控的功能模块
export type ModuleKey =
  | 'channels'
  | 'landing'
  | 'packages'
  | 'coupons'
  | 'users'
  | 'sales'
  | 'orders'
  | 'system'

export const PERMISSION_MODULES: ModuleKey[] = [
  'channels',
  'landing',
  'packages',
  'coupons',
  'users',
  'sales',
  'orders',
  'system',
]

export type Role = {
  id: string
  name: string
  desc: string
  builtin: boolean // 内置角色（不可删除）
  planned?: boolean // 后期随服务节点引入
  dataScope: DataScope
  perms: Record<ModuleKey, PermLevel>
}

export type AccountStatus = '启用' | '停用'

export type Account = {
  id: string
  email: string
  name: string
  roleId: string
  businessLines: string[] // 数据权限范围（dataScope='line' 时生效）
  status: AccountStatus
  lastLogin?: string
}

// 操作日志（审计）
export type AuditLog = {
  id: string
  time: string
  actor: string // 操作人邮箱
  module: ModuleKey
  action: string // 动作描述
  target?: string // 操作对象
}

export type CouponStatus = '已生效' | '已结束'

export type CouponProduct = {
  id: string
  name: string
  price: number
}

// 一张优惠券可包含多个优惠码（如分发给不同 KOL），分别统计领取/使用量用于结算
export type CouponCode = {
  id: string
  code: string
  kol: string // 使用方 / KOL 名称
  used: number // 该码已使用张数
}

export type Coupon = {
  id: string
  name: string
  codes: CouponCode[]
  businessLine: BusinessLine
  couponType: '满减券'
  currency: string
  creator: string
  total: number
  remaining: number
  // 发放及领取规则
  claimStart: string
  claimEnd: string
  // 使用规则
  useStart: string
  useEnd: string
  products: CouponProduct[]
  // 权益规则（满减）
  thresholdAmount: number
  deductAmount: number
  status: CouponStatus
  createdAt: string
}
