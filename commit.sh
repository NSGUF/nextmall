#!/bin/bash

echo "请输入本次提交的描述信息："
read commit_msg

if [ -z "$commit_msg" ]; then
  echo "提交信息不能为空，请重新运行脚本并输入提交信息。"
  exit 1
fi

git add .

if [ $? -ne 0 ]; then
  echo "git add 失败，终止提交。"
  exit 1
fi

git commit -m "$commit_msg"

if [ $? -ne 0 ]; then
  echo "git commit 失败，终止提交。"
  exit 1
fi

git push origin master


if [ $? -eq 0 ]; then
  echo "代码已成功推送到远程仓库！"
else
  echo "git push 失败，请检查网络或权限。"
  exit 1
fi
