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
    router.get('/montar', [NovoController, 'montar'])
    router.post('/montar', [NovoController, 'aplicarKit'])
    router.get('/downloads', [NovoController, 'downloadStatus'])
    router.get('/fichas', [NovoController, 'fichas'])
    router.get('/fichas/:slug', [NovoController, 'ficha'])
    router.get('/referencias/:id', [NovoController, 'referencia'])
    router.get('/perguntar', [NovoController, 'perguntar'])
    router.get('/estado', [NovoController, 'estado'])
    router.get('/fichas-sugeridas', [NovoController, 'fichasSugeridas'])
  })
  .prefix('/novo')
