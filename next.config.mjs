/** @type {import('next').NextConfig} */
const nextConfig = {
  // Aumentar o timeout para o carregamento de chunks
  onDemandEntries: {
    // A página permanecerá no buffer por 30 segundos (padrão é 15)
    maxInactiveAge: 30 * 1000,
    // Número de páginas mantidas na memória
    pagesBufferLength: 5,
  },
  // Configurações para otimização de JavaScript
  webpack: (config, { dev, isServer }) => {
    // Otimizações apenas para produção
    if (!dev && !isServer) {
      // Dividir os chunks em partes menores
      config.optimization.splitChunks = {
        chunks: 'all',
        minSize: 20000,
        maxSize: 100000,
        cacheGroups: {
          default: false,
          vendors: false,
          framework: {
            name: 'framework',
            chunks: 'all',
            test: /[\\/]node_modules[\\/](@next|react|next|tailwindcss)[\\/]/,
            priority: 40,
            enforce: true,
          },
          lib: {
            test: /[\\/]node_modules[\\/]/,
            priority: 30,
            name(module) {
              const packageName = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/)[1];
              return `lib.${packageName.replace('@', '')}`;
            },
          },
          commons: {
            name: 'commons',
            minChunks: 2,
            priority: 20,
          },
          shared: {
            name: 'shared',
            minChunks: 3,
            priority: 10,
          },
        },
      };
    }
    return config;
  },
  // Habilitar o Strict Mode para detectar problemas
  reactStrictMode: true,
  // Comprimir distros HTML
  compress: true,
  // Habilitar suporte para PWA e arquivos de manifesto
  experimental: {
    appDir: true
  },
  // Permitir CORS e aumentar o buffer para uploads
  serverRuntimeConfig: {
    maxBodySize: '10mb', // Para uploads maiores
  },
  // Estratégia de otimização de imagens
  images: {
    domains: ['localhost'],
  },
};

export default nextConfig;
