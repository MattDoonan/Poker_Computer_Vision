// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: false },
  css: [
    '~/assets/css/bootstrap.scss',
    '~/assets/css/global.scss',
  ],
  plugins: [
    { src: '~/plugins/bootstrap.js', mode: 'client' }
  ],
})