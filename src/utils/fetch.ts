import {IHeader, IReqConfig} from "./types";


export enum ContentType {
    json = 'application/json;charset=UTF-8',
}

export enum HttpMethod {
    get = 'GET',
}



/**
 * 请求拦截,这里你可以做一些操作
 */
export function interceptorsRequest(url: string, config: IReqConfig) {
    const contentType: string = setContentType(config)
    const reqUrl = setRequestUrl(url)
    const headers = setHeader(contentType, config)
    return {
        contentType,
        reqUrl,
        headers,
    }
}

/**
 * 设置contentType
 * @param config
 */
const setContentType = (config?: IReqConfig): string => {
    if (config && config['Content-Type'] !== undefined) {
        return config['Content-Type']
    } else {
        return ContentType.json
    }
}
/**
 * 设置请求 url
 * @param url
 */
const setRequestUrl = (url: string): string => {
    return `${url.replace('//', '/')}`
}
/**
 * 设置请求头
 * @param contentType
 * @param config
 */
const setHeader = (contentType: string, config?: IReqConfig) => {
    const token = !config || config.token === undefined ? '' : config.token
    return new Headers({
        token,
        'Content-Type': contentType,
    } as IHeader)
}

/**
 * 响应拦截,这里你可以做一些操作
 */
export const interceptorsResponse = (res: Response, cb: Function) => {
    return cb(res)
}

const request = async (
    url: string,
    config: IReqConfig = {
        params: {},
        method: 'GET',
        headers: {
            'Content-Type': ContentType.json,
            token: '',
        },
        token: '',
        'Content-Type': ContentType.json,
    }
) => {
    // 请求拦截
    const { reqUrl, headers } = interceptorsRequest(url, config)
    // 发送请求
    const promise: Response = await sendRequest(reqUrl, headers as Headers, config)
    // 处理请求结果(响应拦截)
    return interceptorsResponse(promise, handleRes)
}

/**
 * 发送请求
 */
async function sendRequest(url: string, headers: Headers, config: IReqConfig) {
    const res = await fetch(url, {
        headers,
        method: HttpMethod.get,
    })
    return res
}
const handleRes = async (res: Response) => {
    const parsedRes = await parseRes(res)
    // 如果res.ok，则请求成功
    if (res.ok) {
        return parsedRes
    }
    // 请求失败，返回解析之后的失败的数据
    throw parsedRes
}

const parseRes = async (res: Response) => {
    const contentType = res.headers.get('Content-Type')
    let resVal
    // 判定返回的内容类型，做不同的处理
    if (contentType) {
        if (contentType.indexOf('json') > -1) {
            resVal = await res.json()
        }
        if (contentType.indexOf('text') > -1) {
            resVal = await res.text()
        }
        if (contentType.indexOf('form') > -1) {
            resVal = await res.formData()
        }
        if (contentType.indexOf('video') > -1) {
            resVal = await res.blob()
        }
    } else {
        resVal = await res.text()
    }
    return resVal
}

export default request