/*
|--------------------------------------------------------------------------
| Rotas da interface nova
|--------------------------------------------------------------------------
|
| A interface nova vive em /novo, ao lado da clássica, até cobrir tudo.
|
*/

import router from '@adonisjs/core/services/router'

const NovoController = () => import('#controllers/novo_controller')

router
  .group(() => {
    router.get('/', [NovoController, 'inicio'])
    router.get('/busca', [NovoController, 'busca'])
    router.get('/ler/*', [NovoController, 'ler'])
    router.get('/arquivo/*', [NovoController, 'arquivo'])
  })
  .prefix('/novo')
