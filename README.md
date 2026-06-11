# 🧱 Minifig Builder

Editor visual 3D para montar minifigs **com peças oficiais** no navegador — pensado para fotografia de LEGO. Escolha peças reais do catálogo, troque cores, pose o boneco, monte o cenário de estúdio e exporte em alta resolução.

A geometria das peças vem do acervo **[LDraw](https://www.ldraw.org/)** — modelos comunitários precisos das peças oficiais, incluindo estampas clássicas (o rosto sorridente, o logo do Espaço Clássico, a armadura de cavaleiro…). Os offsets de montagem (ombros a ±15.552 LDU com inclinação de 9,79°, mãos a 45°, pivôs das pernas) vêm dos arquivos oficiais de montagem do próprio acervo.

## Funcionalidades

- **~2.300 peças oficiais** varridas do acervo inteiro: 373 cabeças estampadas, 523 cabelos/chapéus/capacetes, 749 torsos estampados, 110 pernas (incl. estampadas articuladas), 347 acessórios de mão, 68 itens de corpo e 122 pets — cobrindo temas clássicos (espaço, castelo, piratas, cidade) e licenciados presentes no acervo (Star Wars, Batman/DC, Marvel, LOTR/Hobbit, Harry Potter, Ninjago…), buscáveis por nome e franquia
- **184 cores oficiais LDraw** agrupadas (sólidas, transparentes, metálicas/peroladas, especiais)
- **Encaixe oficial na mão**: cada acessório usa a matriz/offset do gerador de minifig do MLCad — o item fica preso no clipe em C como na peça real
- **Articulação fiel**: cabeça, braços (eixo inclinado oficial), pulsos e pernas independentes
- **Poses**: presets + sliders finos + pose aleatória
- **📷 Estúdio fotográfico**: fundos (transparente, branco, preto, gradientes, ciclorama 3D) e presets de iluminação (estúdio, dramática, entardecer, suave, fria) com intensidade ajustável
- **🎲 Aleatório** com temas fiéis aos conjuntos clássicos (astronauta vermelho, capitão pirata, cavaleiro…)
- **Desfazer/Refazer**, **salvar criações** com thumbnail (localStorage), **exportar PNG** em alta resolução (fundo transparente opcional), **exportar/importar JSON** e **compartilhar por URL**
- Interface dark em português, responsiva

## Como rodar localmente

```bash
cd minifig-builder
python3 -m http.server 8000
# abra http://localhost:8000
```

Precisa ser servido por HTTP (ES modules + fetch). O Three.js vem por CDN via import map.

## Como funciona

As peças LDraw são pré-empacotadas em arquivos `.mpd` autocontidos (peça + todas as subpeças e primitivas) em `ldraw/parts/`, carregadas sob demanda pelo `LDrawLoader` do Three.js e cacheadas por cor. Nenhum asset é baixado de terceiros em tempo de execução além do próprio Three.js.

```
index.html              entrada + import map do Three.js
data/parts.json         catálogo (números de peça reais + cores padrão)
data/colors.json        paleta (códigos de cor LDraw oficiais)
ldraw/LDConfig.ldr      definições oficiais de cor
ldraw/parts/*.mpd       89 peças empacotadas com dependências (~4 MB)
src/minifig/ldparts.js  carregamento/cache de peças LDraw
src/minifig/figure.js   montagem articulada com offsets oficiais
src/minifig/poses.js    presets de pose
src/state.js            estado, undo/redo, serialização, aleatório
src/ui/                 sidebar, painel (cores/pose/estúdio), toolbar, thumbs
src/main.js             cena, estúdio (fundos/luzes), export PNG
```

## Deploy no GitHub Pages

Settings → Pages → Deploy from a branch → `main` / root. Sem etapa de build.

## Créditos e licenças

- Geometria das peças: **[LDraw Parts Library](https://library.ldraw.org/)** — © contribuidores do LDraw, licença [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) (ver `ldraw/CAreadme.txt`). LDraw é um sistema aberto de CAD para LEGO mantido pela comunidade.
- Renderização: [Three.js](https://threejs.org/).
- LEGO® é marca registrada do Grupo LEGO, que não patrocina, autoriza nem endossa este projeto. Uso pessoal/educacional.
