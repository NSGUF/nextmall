import Dysmsapi20170525, * as $Dysmsapi20170525 from '@alicloud/dysmsapi20170525';
import * as $OpenApi from '@alicloud/openapi-client';
import * as $Util from '@alicloud/tea-util';

import Credential, { Config } from '@alicloud/credentials';

function createClient(): Dysmsapi20170525 {
    // 工程代码建议使用更安全的无 AK 方式，凭据配置方式请参见：https://help.aliyun.com/document_detail/378664.html。
    const credentialsConfig = new Config({
        // 凭证类型。
        type: 'access_key',
        // 设置accessKeyId值，此处已从环境变量中获取accessKeyId为例。
        accessKeyId: process.env.ALIBABA_CLOUD_ACCESS_KEY_ID,
        // 设置accessKeySecret值，此处已从环境变量中获取accessKeySecret为例。
        accessKeySecret: process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET,
    });
    const credential = new Credential(credentialsConfig);
    let config = new $OpenApi.Config({
        credential: credential,
    });
    config.endpoint = `dysmsapi.aliyuncs.com`;
    return new Dysmsapi20170525(config);
}

interface SendSmsParams {
    phoneNumbers: string;
    signName: string;
    templateCode: string;
    templateParam?: string;
}

async function sendSmS(params: SendSmsParams) {
    const client = createClient();
    const sendSmsRequest = new $Dysmsapi20170525.SendSmsRequest({
        phoneNumbers: params.phoneNumbers,
        signName: params.signName,
        templateCode: params.templateCode,
        templateParam: params.templateParam,
    });
    const runtime = new $Util.RuntimeOptions({});
    const resp = await client.sendSmsWithOptions(sendSmsRequest, runtime);
    console.log('[SMS] 发送结果:', JSON.stringify(resp.body));
    return resp;
}

export async function sendSMSOrder(
    phoneNumbers: string,
    templateParams?: Record<string, string>
) {
    return sendSmS({
        phoneNumbers,
        signName: process.env.SMS_SIGN_NAME,
        templateCode: process.env.SMS_TEMPLATE_CODE,
        ...(templateParams && Object.keys(templateParams).length > 0
            ? { templateParam: JSON.stringify(templateParams) }
            : {}),
    });
}
