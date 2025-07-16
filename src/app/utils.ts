
import useCustomToast from "./hooks/useCustomToast"

export const emailPattern = {
  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
  message: "无效邮箱",
}

export const namePattern = {
  value: /^[A-Za-z\s\u00C0-\u017F]{1,30}$/,
  message: "Invalid name",
}

export const passwordRules = (isRequired = true) => {
  const rules: any = {
    minLength: {
      value: 8,
      message: "密码至少8位",
    },
  }

  if (isRequired) {
    rules.required = "请输入密码"
  }

  return rules
}

export const confirmPasswordRules = (
  getValues: () => any,
  isRequired = true,
) => {
  const rules: any = {
    validate: (value: string) => {
      const password = getValues().password || getValues().new_password
      return value === password ? true : "密码不匹配"
    },
  }

  if (isRequired) {
    rules.required = "请输入确认密码"
  }

  return rules
}

export const handleError = (err) => {
  const { showErrorToast } = useCustomToast()
  const errDetail = err?.message
  let errorMessage = errDetail ?? "系统错误"
  if (Array.isArray(errDetail) && errDetail.length > 0) {
    errorMessage = errDetail[0].msg
  }
  showErrorToast(errorMessage)
}