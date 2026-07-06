import { useEffect, useRef, useState } from 'react'
import { Avatar, Button, DatePicker, Form, Input, Modal, Select, Space, Tag, Typography, message } from 'antd'
import { PhoneOutlined, PhoneFilled, LoadingOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import type { CallResult, Student } from '../types'
import { CALL_RESULTS } from '../types'
import { addCallRecord } from '../store'
import { usePerm } from '../perm'
import { useI18n } from '../i18n'

const { Text } = Typography

// 通话生命周期：振铃 → 通话中 → 通话小结（回写）
type Phase = 'calling' | 'connected' | 'summary'

function fmtDuration(sec: number) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

// 轻量外呼：点击拨号按钮，弹出模拟软电话，挂断后填写通话小结并回写到客户档案
export default function DialButton({
  student,
  block,
  size = 'middle',
}: {
  student: Student
  block?: boolean
  size?: 'small' | 'middle' | 'large'
}) {
  const { t } = useI18n()
  const { actor } = usePerm()
  const [open, setOpen] = useState(false)
  const [phase, setPhase] = useState<Phase>('calling')
  const [seconds, setSeconds] = useState(0)
  const [result, setResult] = useState<CallResult>('已接通')
  const [note, setNote] = useState('')
  const [nextFollow, setNextFollow] = useState<dayjs.Dayjs | null>(null)
  const startRef = useRef<string>('')
  const ringTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const tickTimer = useRef<ReturnType<typeof setInterval> | null>(null)

  const phone = student.phone || ''

  const clearTimers = () => {
    if (ringTimer.current) clearTimeout(ringTimer.current)
    if (tickTimer.current) clearInterval(tickTimer.current)
    ringTimer.current = null
    tickTimer.current = null
  }

  useEffect(() => clearTimers, [])

  const startCall = () => {
    if (!phone) return
    setOpen(true)
    setPhase('calling')
    setSeconds(0)
    setResult('已接通')
    setNote('')
    setNextFollow(null)
    startRef.current = dayjs().format('YYYY-MM-DD HH:mm:ss')
    clearTimers()
    // 模拟振铃 ~2s 后接通
    ringTimer.current = setTimeout(() => {
      setPhase('connected')
      tickTimer.current = setInterval(() => setSeconds((v) => v + 1), 1000)
    }, 2000)
  }

  // 通话中挂断 → 已接通并进入小结
  const hangUp = () => {
    clearTimers()
    setResult('已接通')
    setPhase('summary')
  }

  // 振铃中取消 → 未接通并进入小结
  const cancelRinging = () => {
    clearTimers()
    setSeconds(0)
    setResult('无人接听')
    setPhase('summary')
  }

  const connected = result === '已接通'

  const saveAndWriteBack = () => {
    addCallRecord(
      {
        studentId: student.studentId,
        phone,
        direction: '呼出',
        result,
        agent: actor,
        startTime: startRef.current,
        duration: connected ? seconds : 0,
        note: note.trim() || undefined,
        recordingUrl: connected ? '#' : undefined,
      },
      {
        followNote: note.trim() ? `${t(`call.result.${result}`)}｜${note.trim()}` : t(`call.result.${result}`),
        nextFollow: nextFollow ? nextFollow.format('YYYY-MM-DD HH:mm:ss') : undefined,
      },
    )
    message.success(t('call.writeBackOk'))
    setOpen(false)
    clearTimers()
  }

  const close = () => {
    setOpen(false)
    clearTimers()
  }

  return (
    <>
      <Button
        type="link"
        size={size}
        block={block}
        icon={<PhoneOutlined />}
        disabled={!phone}
        onClick={startCall}
      >
        {t('call.dial')}
      </Button>

      <Modal
        open={open}
        title={t('call.softphone')}
        footer={null}
        onCancel={phase === 'summary' ? undefined : close}
        maskClosable={false}
        closable={phase !== 'summary'}
        width={420}
        destroyOnClose
      >
        {/* 客户信息头 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <Avatar size={48} style={{ background: '#2F6BFF' }}>
            {(student.localName || student.name || '?').slice(0, 1)}
          </Avatar>
          <div>
            <div style={{ fontWeight: 600, fontSize: 16 }}>{student.localName || student.name}</div>
            <Text type="secondary">{phone}</Text>
            <div>
              <Tag style={{ marginTop: 4 }}>{student.businessLine}</Tag>
            </div>
          </div>
        </div>

        {phase === 'calling' && (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{ fontSize: 40, color: '#2F6BFF', marginBottom: 12 }}>
              <LoadingOutlined />
            </div>
            <div style={{ fontSize: 16, marginBottom: 24 }}>{t('call.ringing')}</div>
            <Button danger shape="round" size="large" icon={<PhoneFilled />} onClick={cancelRinging}>
              {t('call.cancel')}
            </Button>
          </div>
        )}

        {phase === 'connected' && (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <Tag color="green" style={{ marginBottom: 12 }}>
              {t('call.connected')}
            </Tag>
            <div style={{ fontSize: 34, fontWeight: 600, fontVariantNumeric: 'tabular-nums', marginBottom: 24 }}>
              {fmtDuration(seconds)}
            </div>
            <Button
              danger
              type="primary"
              shape="round"
              size="large"
              icon={<PhoneFilled />}
              onClick={hangUp}
            >
              {t('call.hangup')}
            </Button>
          </div>
        )}

        {phase === 'summary' && (
          <div style={{ paddingTop: 8 }}>
            {connected && (
              <div style={{ marginBottom: 12 }}>
                <Text type="secondary">{t('call.duration')}：</Text>
                <Text strong>{fmtDuration(seconds)}</Text>
              </div>
            )}
            <Form layout="vertical">
              <Form.Item label={t('call.result')} required style={{ marginBottom: 12 }}>
                <Select
                  value={result}
                  onChange={(v) => setResult(v)}
                  options={CALL_RESULTS.map((r) => ({ label: t(`call.result.${r}`), value: r }))}
                />
              </Form.Item>
              <Form.Item label={t('call.summary')} style={{ marginBottom: 12 }}>
                <Input.TextArea
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={t('call.summaryPlaceholder')}
                />
              </Form.Item>
              <Form.Item label={t('call.nextFollow')} style={{ marginBottom: 4 }}>
                <DatePicker
                  showTime
                  style={{ width: '100%' }}
                  format="YYYY-MM-DD HH:mm"
                  value={nextFollow}
                  onChange={setNextFollow}
                />
              </Form.Item>
            </Form>
            <Space style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
              <Button onClick={close}>{t('call.discard')}</Button>
              <Button type="primary" onClick={saveAndWriteBack}>
                {t('call.writeBack')}
              </Button>
            </Space>
          </div>
        )}
      </Modal>
    </>
  )
}
