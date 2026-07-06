import type { Student } from './types'

// 是否能获取到用户手机号
export function hasContactPhone(s: Student): boolean {
  return !!(s.phone && s.phone.trim())
}

// 已注册-未体验：用户状态为「注册」
export function isRegisteredNotTried(s: Student): boolean {
  return s.status === '注册'
}

// 销售中心线索：已注册未体验，且能拿到手机号 → 自动进入销售中心
// 一旦跟进为「已付费」，会改写 status 为「付费」，从而离开销售中心、进入用户中心
export function isSalesLead(s: Student): boolean {
  return isRegisteredNotTried(s) && hasContactPhone(s)
}

// 待领取：线索且尚无领取人
export function isPoolLead(s: Student): boolean {
  return isSalesLead(s) && !s.salesOwner
}

// 已领取（跟进中/暂不跟进）
export function isClaimedLead(s: Student): boolean {
  return isSalesLead(s) && !!s.salesOwner
}

// 进入用户中心的用户：
// - 已注册未体验但拿不到手机号 → 直接进用户中心
// - 已付费及后续状态 → 全部进用户中心
export function inUserCenter(s: Student): boolean {
  return !isSalesLead(s)
}
