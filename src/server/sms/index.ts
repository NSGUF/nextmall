import Dysmsapi20170525, * as $Dysmsapi20170525 from '@alicloud/dysmsapi20170525';
import * as $OpenApi from '@alicloud/openapi-client';
import * as $Util from '@alicloud/tea-util';

function createClient(): Dysmsapi20170525 {
    const config = new $OpenApi.Config({
        accessKeyId: process.env.ALIBABA_CLOUD_ACCESS_KEY_ID,
        accessKeySecret: process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET,
    });
    config.endpoint = 'dysmsapi.aliyuncs.com';
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
    console.log(process.env.ALIBABA_CLOUD_ACCESS_KEY_ID);
    console.log(process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET);
    console.log(process.env.SMS_SIGN_NAME);
    console.log(process.env.SMS_TEMPLATE_CODE);
    return sendSmS({
        phoneNumbers,
        signName: process.env.SMS_SIGN_NAME,
        templateCode: process.env.SMS_TEMPLATE_CODE,
        ...(templateParams && Object.keys(templateParams).length > 0
            ? { templateParam: JSON.stringify(templateParams) }
            : {}),
    });
}
