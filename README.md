# 🧱 Minifig Builder

Editor visual 3D para montar minifigs no navegador — estilo Hero Forge, mas para bonequinhos de blocos. Escolha peças de um catálogo, troque cores, pose o boneco e exporte o resultado.

**100% estático, sem backend e sem nenhum asset externo**: toda a geometria é construída proceduralmente com primitivas do Three.js, e todas as estampas (rostos, torsos, cintos) são desenhadas programaticamente em canvas 2D e aplicadas como `CanvasTexture`.

## Funcionalidades

- **Catálogo com ~75 peças**: 12 rostos, 16 cabelos/chapéus, 12 torsos estampados, 5 tipos de pernas, 23 acessórios de mão, capas/mochilas/tanques/aljava, bases e pets (cachorro, gato, papagaio no ombro)
- **20 cores clássicas** (incl. dourado perolado metálico e transparente) — toda peça aceita troca de cor
- **Articulação real**: cabeça, braços, mãos e pernas com pivôs independentes
- **Poses**: presets (parado, acenando, caminhando, correndo, sentado, herói) + sliders finos + pose aleatória
- **🎲 Aleatório** com temas coerentes (astronauta, pirata, cavaleiro, bombeiro, mago…)
- **Desfazer/Refazer** (Ctrl+Z / Ctrl+Shift+Z)
- **Salvar** criações no navegador (localStorage) com thumbnail
- **Exportar PNG** em alta resolução com fundo transparente opcional
- **Exportar/Importar JSON** da configuração
- **Compartilhar por URL** — a config inteira vai serializada no hash do link
- Interface dark em português, responsiva (drawer inferior no mobile)

## Como rodar localmente

É um site estático, mas usa ES modules e `fetch` — precisa ser servido por HTTP:

```bash
cd minifig-builder
python3 -m http.server 8000
# abra http://localhost:8000
```

(Qualquer servidor estático funciona: `npx serve`, `php -S`, etc. O Three.js vem por CDN via import map — precisa de internet na primeira carga.)

## Deploy no GitHub Pages

1. Suba este diretório para um repositório no GitHub
2. Em **Settings → Pages**, escolha **Deploy from a branch**, branch `main`, pasta `/ (root)`
3. Pronto — o app fica em `https://<seu-usuario>.github.io/<repo>/`

Não há etapa de build: os arquivos são servidos como estão.

## Arquitetura

```
index.html              ponto de entrada + import map do Three.js
styles.css              tema dark
data/parts.json         catálogo de peças (fonte única de verdade)
data/colors.json        paleta de cores
src/main.js             cena 3D, iluminação, loop, export PNG
src/state.js            estado, undo/redo, serialização, aleatório
src/minifig/figure.js   geometria do corpo + montagem + articulação
src/minifig/parts3d.js  construtores procedurais de chapéus/acessórios/extras
src/minifig/decals.js   rostos e estampas via canvas 2D
src/minifig/poses.js    presets de pose
src/ui/sidebar.js       abas, busca e grid de peças
src/ui/panel.js         cores, poses e nome
src/ui/toolbar.js       salvar, exportar, compartilhar, modais
src/ui/thumbs.js        miniaturas 3D renderizadas sob demanda
```

As peças usam IDs no estilo BrickLink quando o número real é conhecido (ex.: `3626` para cabeça, `973` para torso, `3842` para o capacete espacial clássico).

---

Feito com [Three.js](https://threejs.org/). Nenhuma marca ou tema licenciado — todos os nomes de peças são genéricos.
