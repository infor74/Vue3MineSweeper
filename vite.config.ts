import { defineConfig, loadEnv } from 'vite'
import { ViteAliases } from 'vite-aliases'

import Icons from 'unplugin-icons/vite'
import IconsResolver from 'unplugin-icons/resolver'

import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'


import vue from '@vitejs/plugin-vue'

// import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
    const { VITE_PUBLIC_PATH } = loadEnv(mode, process.cwd(), "") as unknown as ImportMetaEnv

    return {
        base: VITE_PUBLIC_PATH,
        plugins: [
            vue(),
            ViteAliases({ prefix: '@' }),
            AutoImport({
                resolvers: [
                    ElementPlusResolver(),
                    // 自动导入图标组件
                    IconsResolver({
                        prefix: 'Icon',
                    }),
                ],
            }),
            Components({
                resolvers: [
                    // 自动注册图标组件
                    IconsResolver({
                        enabledCollections: [ 'ep' ],
                    }),
                    ElementPlusResolver()
                ],
            }),
            Icons({
                autoInstall: true,
            }),
        ],
    }
})
