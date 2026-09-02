import axios, { AxiosInstance } from 'axios'
import { HttpsProxyAgent } from 'https-proxy-agent'

function buildFixieAxios(): AxiosInstance {
  const fixieUrl = process.env.FIXIE_URL

  if (!fixieUrl) {
    console.warn('[v0] FIXIE_URL not set — outbound SMS requests will use the default (non-whitelisted) IP.')
    return axios.create()
  }

  const agent = new HttpsProxyAgent(fixieUrl)

  return axios.create({
    httpsAgent: agent,
    proxy: false,
  })
}

export const fixieAxios = buildFixieAxios()