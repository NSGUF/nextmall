# 用户管理模块

## 概述

用户管理模块是管理后台的核心功能之一，允许超级管理员对系统中的用户进行全面管理。该模块参考了banner模块的设计模式，提供了完整的CRUD操作和用户友好的界面。

## 功能特性

### 1. 用户列表管理
- **分页显示**：支持分页浏览用户列表，默认每页10条记录
- **排序功能**：支持按各字段进行升序/降序排序
- **状态显示**：直观显示用户状态（正常/禁用）和角色信息
- **批量操作**：支持批量删除用户

### 2. 用户信息管理
支持管理以下用户字段：
- **name**：用户名（必填）
- **email**：邮箱地址（可选，但如果填写必须唯一）
- **phone**：手机号码（可选）
- **status**：用户状态（1=正常，0=禁用）
- **role**：用户角色（SUPERADMIN/VENDOR/STORE/NORMAL）
- **password**：密码（创建时必填，编辑时可选）

### 3. 角色权限
- **SUPERADMIN**：超级管理员，拥有所有权限
- **VENDOR**：供应商，可以发布商品
- **STORE**：普通门店
- **NORMAL**：普通用户

### 4. 安全特性
- **密码加密**：使用bcrypt进行密码哈希存储
- **软删除**：删除用户时使用软删除，设置isDeleted=true
- **权限控制**：只有超级管理员可以访问用户管理功能
- **数据验证**：前端和后端双重数据验证

## API接口

### 用户列表查询
```typescript
api.user.list.useQuery({
    orderBy?: string,
    order?: 'asc' | 'desc',
    page?: number,
    pageSize?: number,
    role?: 'SUPERADMIN' | 'VENDOR' | 'STORE' | 'NORMAL',
    status?: number
})
```

### 创建用户
```typescript
api.user.create.useMutation({
    name: string,
    email?: string,
    phone?: string,
    status: number,
    role: 'SUPERADMIN' | 'VENDOR' | 'STORE' | 'NORMAL',
    password?: string
})
```

### 更新用户
```typescript
api.user.update.useMutation({
    id: string,
    name: string,
    email?: string,
    phone?: string,
    status: number,
    role: 'SUPERADMIN' | 'VENDOR' | 'STORE' | 'NORMAL',
    password?: string
})
```

### 删除用户
```typescript
api.user.delete.useMutation({
    id: string
})
```

### 批量删除用户
```typescript
api.user.deleteMany.useMutation({
    ids: string[]
})
```

## 页面功能

### 访问路径
管理后台用户管理页面：`/admin/user`

### 主要功能
1. **用户列表展示**
   - 显示用户名、邮箱、手机号、状态、角色、创建时间
   - 支持表格排序和分页
   - 实时状态和角色显示

2. **新增用户**
   - 点击"新增用户"按钮打开表单弹窗
   - 填写用户基本信息
   - 设置用户角色和状态
   - 密码为必填项

3. **编辑用户**
   - 点击用户行的"编辑"按钮
   - 修改用户信息
   - 密码字段可留空（表示不修改密码）

4. **删除用户**
   - 单个删除：点击"删除"按钮，确认后执行软删除
   - 批量删除：选择多个用户后批量删除

## 操作日志

系统会自动记录所有用户管理操作：
- **CREATE**：创建用户
- **UPDATE**：更新用户信息
- **DELETE**：删除用户（包括批量删除）

日志包含以下信息：
- 操作类型和描述
- 操作目标用户ID
- 操作者信息
- IP地址和User Agent
- 操作时间和耗时
- 操作状态（成功/失败）

## 数据库设计

用户管理主要涉及以下数据表：

### User表字段
- `id`：用户唯一标识
- `name`：用户名
- `email`：邮箱（唯一）
- `phone`：手机号
- `status`：状态（1=正常，0=禁用）
- `role`：角色枚举
- `password`：加密密码
- `isDeleted`：软删除标记
- `createdAt`：创建时间
- `updatedAt`：更新时间

### 查询优化
- 用户列表查询自动过滤已删除用户（isDeleted=false）
- 支持按角色和状态进行筛选
- 不返回敏感信息（如密码）

## 使用示例

### 创建供应商用户
1. 访问 `/admin/user`
2. 点击"新增用户"
3. 填写用户信息：
   - 用户名：张三供应商
   - 邮箱：zhangsan@vendor.com
   - 手机：13800138000
   - 角色：供应商
   - 状态：正常
   - 密码：设置初始密码
4. 点击"创建"完成

### 批量管理用户
1. 在用户列表中选择多个用户
2. 点击"批量删除"按钮
3. 确认操作后执行批量软删除

## 注意事项

1. **权限要求**：只有SUPERADMIN角色可以访问用户管理功能
2. **邮箱唯一性**：如果填写邮箱，必须确保在系统中唯一
3. **软删除机制**：删除的用户不会从数据库中物理删除，只是标记为已删除
4. **密码安全**：所有密码都经过bcrypt加密存储
5. **操作审计**：所有操作都会记录详细的操作日志

## 测试验证

项目包含完整的测试脚本 `scripts/test-user-management.js`，验证以下功能：
- 用户创建
- 用户查询和筛选
- 用户更新
- 用户软删除
- 操作日志记录

运行测试：
```bash
node scripts/test-user-management.js
```

## 技术实现

- **前端框架**：Next.js + React
- **UI组件**：Chakra UI
- **表单管理**：React Hook Form
- **状态管理**：tRPC + React Query
- **数据库**：Prisma + PostgreSQL
- **权限控制**：基于用户角色的访问控制
- **日志系统**：自定义操作日志记录
