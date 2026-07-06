import { useMemo, useState } from 'react'
import {
  Button,
  Card,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd'
import { EditOutlined, HistoryOutlined, SearchOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { setState, useStore } from '../store'
import type { AppChannel, LoginMethod, Student, StudentEditLog, StudentFieldChange, UserStatus, UserType } from '../types'
import { AGE_GROUPS, APP_CHANNELS, USER_STATUSES, USER_TYPES } from '../types'
import { useI18n } from '../i18n'
import { usePerm } from '../perm'
import { hasPhoneLogin, resolveUserType } from '../userType'
import LocalTime from '../components/LocalTime'

const { Text } = Typography

const STATUS_COLOR: Record<UserStatus, string> = {
  注册: 'default',
  付费: 'green',
  付费逾期: 'red',
}

const METHOD_COLOR: Record<LoginMethod, string> = {
  谷歌邮箱: 'red',
  Facebook: 'blue',
  kakao: 'gold',
  手机号: 'green',
  AppID: 'purple',
}

const APP_CHANNEL_COLOR: Record<AppChannel, string> = {
  'App Store': 'blue',
  'Google Play': 'green',
}

const USER_TYPE_COLOR: Record<UserType, string> = {
  正式用户: 'green',
  测试用户: 'gold',
}

export default function UserCenterP1() {
  const { t } = useI18n()
  const students = useStore((s) => s.students)
  const { can, allowedLines, actor } = usePerm()
  const canEdit = can('users') === 'operate'
  const scope = allowedLines()
  const [keyword, setKeyword] = useState('')
  const [countryFilter, setCountryFilter] = useState<string | undefined>()
  const [channelFilter, setChannelFilter] = useState<string | undefined>()
  const [statusFilter, setStatusFilter] = useState<string | undefined>()
  const [typeFilter, setTypeFilter] = useState<string | undefined>()
  const [editing, setEditing] = useState<Student | null>(null)
  const [historyOf, setHistoryOf] = useState<Student | null>(null)
  const [form] = Form.useForm()

  // 数据权限：底层仍按业务线隔离（一期不展示业务线，仅展示国家）
  const scoped = useMemo(
    () => (scope ? students.filter((s) => scope.includes(s.businessLine)) : students),
    [students, scope],
  )

  const countries = useMemo(
    () => Array.from(new Set(scoped.map((s) => s.country).filter(Boolean))) as string[],
    [scoped],
  )

  const data = useMemo(
    () =>
      scoped.filter((s) => {
        const kw = keyword.trim().toLowerCase()
        const matchKw =
          !kw ||
          s.studentId.toLowerCase().includes(kw) ||
          (s.localName ?? s.name).toLowerCase().includes(kw) ||
          s.account.toLowerCase().includes(kw)
        const matchCountry = !countryFilter || s.country === countryFilter
        const matchChannel = !channelFilter || s.appChannel === channelFilter
        const matchStatus = !statusFilter || s.status === statusFilter
        const matchType = !typeFilter || resolveUserType(s) === typeFilter
        return matchKw && matchCountry && matchChannel && matchStatus && matchType
      }),
    [scoped, keyword, countryFilter, channelFilter, statusFilter, typeFilter],
  )

  const phoneLocked = editing ? hasPhoneLogin(editing) : false

  const openEdit = (s: Student) => {
    setEditing(s)
    form.setFieldsValue({
      localName: s.localName,
      ageGroup: s.ageGroup,
      userType: resolveUserType(s),
    })
  }

  const submitEdit = async () => {
    const v = await form.validateFields()
    if (!editing) return
    const locked = hasPhoneLogin(editing)
    const changes: StudentFieldChange[] = []
    if ((v.localName || '') !== (editing.localName || ''))
      changes.push({ field: t('user.label.localName'), before: editing.localName || '', after: v.localName || '' })
    if ((v.ageGroup || '') !== (editing.ageGroup || ''))
      changes.push({ field: t('user.label.ageGroup'), before: editing.ageGroup || '', after: v.ageGroup || '' })
    if (!locked && v.userType !== resolveUserType(editing))
      changes.push({
        field: t('user.col.userType'),
        before: t(`enum.userType.${resolveUserType(editing)}`),
        after: t(`enum.userType.${v.userType}`),
      })
    const entry: StudentEditLog = {
      time: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      action: 'user.hist.edit',
      changes,
      modifier: actor,
    }
    setState((prev) => ({
      ...prev,
      students: prev.students.map((s) =>
        s.studentId === editing.studentId
          ? {
              ...s,
              localName: v.localName,
              ageGroup: v.ageGroup,
              // 手机号/kakao 由规则自动判定，不接受手动修改
              userType: locked ? s.userType : v.userType,
              lastModifier: changes.length ? actor : s.lastModifier,
              editHistory: changes.length ? [entry, ...(s.editHistory || [])] : s.editHistory,
            }
          : s,
      ),
    }))
    setEditing(null)
  }

  const columns: ColumnsType<Student> = [
    { title: t('user.col.id'), dataIndex: 'studentId', width: 190, fixed: 'left' },
    {
      title: t('user.col.name'),
      dataIndex: 'localName',
      width: 140,
      render: (_, r) => <span>{r.localName || r.name}</span>,
    },
    {
      title: t('user.col.status'),
      dataIndex: 'status',
      width: 100,
      render: (v: UserStatus) => <Tag color={STATUS_COLOR[v]}>{t(`enum.status.${v}`)}</Tag>,
    },
    {
      title: t('user.col.userType'),
      dataIndex: 'userType',
      width: 110,
      render: (_: UserType, r: Student) => {
        const tp = resolveUserType(r)
        return <Tag color={USER_TYPE_COLOR[tp]}>{t(`enum.userType.${tp}`)}</Tag>
      },
    },
    {
      title: t('user.col.ageGroup'),
      dataIndex: 'ageGroup',
      width: 100,
      render: (v: string | undefined) => (v ? <Tag color="geekblue">{v}</Tag> : <Text type="secondary">—</Text>),
    },
    {
      title: t('user.col.method'),
      dataIndex: 'loginMethod',
      width: 120,
      render: (v: LoginMethod) => <Tag color={METHOD_COLOR[v]}>{t(`enum.method.${v}`)}</Tag>,
    },
    {
      title: t('user.col.account'),
      dataIndex: 'account',
      width: 220,
      render: (v) => <Text>{v}</Text>,
    },
    {
      title: t('user.col.appChannel'),
      dataIndex: 'appChannel',
      width: 140,
      render: (v: AppChannel | undefined) =>
        v ? <Tag color={APP_CHANNEL_COLOR[v]}>{v}</Tag> : <Text type="secondary">—</Text>,
    },
    {
      title: t('user.col.country'),
      dataIndex: 'country',
      width: 120,
      render: (v: string | undefined) => (v ? <Tag>{v}</Tag> : <Text type="secondary">—</Text>),
    },
    {
      title: t('user.col.regTime'),
      dataIndex: 'registerTime',
      width: 200,
      render: (v: string | undefined, r: Student) => <LocalTime time={v} country={r.country} />,
    },
    {
      title: t('user.col.expireTime'),
      dataIndex: 'expireTime',
      width: 200,
      render: (v: string | undefined, r: Student) => <LocalTime time={v} country={r.country} />,
    },
    {
      title: t('user.col.modifier'),
      dataIndex: 'lastModifier',
      width: 200,
      render: (v: string | undefined, r: Student) =>
        v ? (
          <Button type="link" style={{ padding: 0, height: 'auto' }} onClick={() => setHistoryOf(r)}>
            {v}
            <HistoryOutlined style={{ marginInlineStart: 6 }} />
          </Button>
        ) : (
          <Text type="secondary">—</Text>
        ),
    },
    ...(canEdit
      ? [
          {
            title: t('common.action'),
            key: 'action',
            width: 120,
            fixed: 'right' as const,
            render: (_: unknown, r: Student) => (
              <Button type="link" icon={<EditOutlined />} onClick={() => openEdit(r)}>
                {t('user.editInfo')}
              </Button>
            ),
          },
        ]
      : []),
  ]

  return (
    <Card className="page-card" bordered={false} title={<span className="section-title">{t('user.title')}</span>}>
      <Space wrap style={{ marginBottom: 16 }}>
        <Input
          allowClear
          prefix={<SearchOutlined />}
          placeholder={t('user.searchPlaceholder')}
          style={{ width: 280 }}
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
        <Select
          allowClear
          placeholder={t('user.col.userType')}
          style={{ width: 140 }}
          value={typeFilter}
          onChange={setTypeFilter}
          options={USER_TYPES.map((tp) => ({ label: t(`enum.userType.${tp}`), value: tp }))}
        />
        <Select
          allowClear
          placeholder={t('user.col.appChannel')}
          style={{ width: 150 }}
          value={channelFilter}
          onChange={setChannelFilter}
          options={APP_CHANNELS.map((c) => ({ label: c, value: c }))}
        />
        <Select
          allowClear
          placeholder={t('user.col.country')}
          style={{ width: 130 }}
          value={countryFilter}
          onChange={setCountryFilter}
          options={countries.map((c) => ({ label: c, value: c }))}
        />
        <Select
          allowClear
          placeholder={t('user.filterStatus')}
          style={{ width: 150 }}
          value={statusFilter}
          onChange={setStatusFilter}
          options={USER_STATUSES.map((l) => ({ label: t(`enum.status.${l}`), value: l }))}
        />
      </Space>

      <Table
        rowKey="studentId"
        columns={columns}
        dataSource={data}
        scroll={{ x: 1810 }}
        pagination={{ showTotal: (n) => t('common.total', { n }), showSizeChanger: true }}
      />

      <Modal
        open={!!editing}
        title={t('user.modalTitle', { id: editing?.studentId ?? '' })}
        onCancel={() => setEditing(null)}
        onOk={submitEdit}
        okText={t('common.save')}
        cancelText={t('common.cancel')}
        destroyOnClose
      >
        <Form form={form} layout="vertical" preserve={false} style={{ marginTop: 12 }}>
          <Form.Item name="localName" label={t('user.label.localName')}>
            <Input placeholder={t('user.localNamePlaceholder')} />
          </Form.Item>
          <Form.Item name="ageGroup" label={t('user.label.ageGroup')}>
            <Select
              allowClear
              placeholder={t('common.pleaseSelect')}
              options={AGE_GROUPS.map((g) => ({ label: g, value: g }))}
            />
          </Form.Item>
          <Form.Item
            name="userType"
            label={t('user.col.userType')}
            tooltip={phoneLocked ? t('user.userTypeAutoTip') : undefined}
          >
            <Select
              disabled={phoneLocked}
              options={USER_TYPES.map((tp) => ({ label: t(`enum.userType.${tp}`), value: tp }))}
            />
          </Form.Item>
          <Form.Item label={t('user.col.country')}>
            <Input value={editing?.country} disabled />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        open={!!historyOf}
        title={t('user.hist.title')}
        onCancel={() => setHistoryOf(null)}
        footer={null}
        width={640}
        destroyOnClose
      >
        <Table<StudentEditLog>
          rowKey={(r) => `${r.time}-${r.modifier}`}
          size="small"
          pagination={false}
          dataSource={historyOf?.editHistory ?? []}
          locale={{ emptyText: t('user.hist.empty') }}
          columns={[
            { title: t('user.hist.col.time'), dataIndex: 'time', width: 170 },
            {
              title: t('user.hist.col.detail'),
              dataIndex: 'changes',
              render: (changes: StudentFieldChange[] | undefined, r: StudentEditLog) => {
                if (changes && changes.length)
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {changes.map((c, i) => (
                        <div key={i}>
                          <Text type="secondary">{c.field}：</Text>
                          <Text delete type="secondary">{c.before || t('user.hist.blank')}</Text>
                          <Text type="secondary"> → </Text>
                          <Text strong>{c.after || t('user.hist.blank')}</Text>
                        </div>
                      ))}
                    </div>
                  )
                return r.detail ? <span>{r.detail}</span> : <Text type="secondary">—</Text>
              },
            },
            { title: t('user.hist.col.modifier'), dataIndex: 'modifier', width: 190 },
          ]}
        />
      </Modal>
    </Card>
  )
}
