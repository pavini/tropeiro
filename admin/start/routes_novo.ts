/*
|--------------------------------------------------------------------------
| Rotas da interface nova
|--------------------------------------------------------------------------
|
| A interface nova é a principal e fica na raiz. A clássica segue nos
| endereços dela (/home, /settings, /supply-depot...) como administração
| avançada. Endereços antigos em /novo redirecionam para os novos.
|
*/

import router from '@adonisjs/core/services/router'

const NovoController = () => import('#controllers/novo_controller')

// Links e favoritos da época em que a interface nova vivia em /novo.
router.get('/novo', ({ response }) => response.redirect().toPath('/'))
router.get('/novo/*', ({ request, response }) =>
  response.redirect().toPath(request.url(true).replace(/^\/novo(?=\/)/, ''))
)

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
router.get('/conteudo', [NovoController, 'conteudo'])
router.post('/conteudo/apagar', [NovoController, 'apagarConteudo'])
router.get('/apps', [NovoController, 'apps'])
router.get('/mapa', [NovoController, 'mapa'])
router.get('/mapa/estilo', [NovoController, 'mapaEstilo'])
router.get('/mapa/lugares', [NovoController, 'mapaLugares'])
router.post('/apps', [NovoController, 'appAcao'])
router.get('/ia', [NovoController, 'ia'])
router.get('/ia/testar', [NovoController, 'iaTestar'])
router.post('/ia/endereco', [NovoController, 'iaEndereco'])
router.post('/ia/modelo', [NovoController, 'iaModelo'])
router.get('/fichas-sugeridas', [NovoController, 'fichasSugeridas'])
