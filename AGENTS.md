# Contexto para agentes de desenvolvimento

Este arquivo orienta o Claude e qualquer outro agente que trabalhe neste repositório. Leia-o antes de alterar o projeto.

## Visão do produto

- **Kanbam** é uma ferramenta pessoal de organização das demandas de desenvolvimento de Nicolas Nordio.
- O nome `Kanbam` é intencional e faz parte da identidade do produto; não o corrija para `Kanban` sem solicitação explícita.
- O projeto é pessoal, independente da Astoria, e está publicado no repositório público `NicolasSnordio/kanbam_tool`.
- A proposta é manter o aplicativo simples, bonito, rápido e útil para uma única pessoa gerenciar seu fluxo de trabalho.
- Por ser um projeto público, nunca inclua credenciais, tokens, dados internos de empresas ou informações sensíveis no código, nos exemplos, nos commits ou na documentação.

## Fluxo oficial

O quadro deve preservar esta ordem e estes nomes:

`Entrada → Backlog → Próximos → Em andamento → Aguardando → Concluído`

Não altere, remova ou reorganize as etapas sem uma solicitação explícita.

## Stack e execução

- React 19 com Vite 8.
- Tailwind CSS 4.
- Anime.js 4 para animações.
- Lucide React para ícones.
- Node.js `>=22.12.0`.

Comandos principais:

```bash
npm install
npm run dev
npm run lint
npm run build
```

Antes de concluir uma alteração, execute pelo menos `npm run lint` e `npm run build`.

## Estado atual do aplicativo

- A aplicação é uma SPA e sua implementação está concentrada em `src/App.jsx`.
- A tela de login é demonstrativa: a sessão fica em `sessionStorage` pela chave `kanbam.session.v1`; ainda não existe backend de autenticação.
- As tarefas ficam em `localStorage` pela chave `kanbam.tasks.v1`.
- O quadro oferece criação, edição, exclusão, busca, filtro de prioridade e movimentação de tarefas entre colunas.
- A aba **Agenda** exibe as tarefas em um calendário mensal de acordo com `dueDate`.
- A navegação entre **Meu quadro** e **Agenda** deve manter o conteúdo visível e o estado das tarefas.
- A tela de login possui uma entrada animada e um rastro de fumaça verde que acompanha o cursor. O efeito usa Anime.js, tem três camadas com atrasos diferentes e deve permanecer sutil.
- Respeite `prefers-reduced-motion`: recursos puramente animados devem ser reduzidos ou desativados para esse público.

## Direção visual e experiência

- Preserve a estética escura, limpa e compacta, com verde-lima como destaque principal.
- Use animações suaves e funcionais; evite efeitos fortes, bruscos ou que pareçam defeitos visuais.
- Os cartões do quadro são deliberadamente compactos para permitir uma visão ampla das tarefas ativas.
- Garanta responsividade e acessibilidade básica: rótulos acessíveis, foco visível, contraste adequado e navegação funcional.
- Não adicione legendas ou textos instrucionais que expliquem interações óbvias da interface, como “passe o mouse”, “clique”, “arraste” ou “selecione”.
- Priorize affordances visuais, `aria-label`, estados de foco e estados de hover em vez de mensagens explicativas permanentes.
- Não introduza tooltips de ajuda ou microtextos de instrução sem solicitação explícita do usuário.

## Boas práticas de implementação

- Faça alterações pequenas e focadas; preserve funcionalidades que não façam parte do pedido.
- Reaproveite os componentes, tokens visuais e padrões existentes antes de criar novas abstrações.
- Não adicione dependências sem necessidade clara.
- Mantenha os dados locais compatíveis com tarefas já gravadas no navegador. Se o formato mudar, implemente migração ou fallback seguro.
- Não trate o login atual como autenticação segura nem o apresente como pronto para produção.
- Verifique no navegador mudanças visuais e fluxos de navegação, além das validações automatizadas.
- Não edite artefatos gerados em `dist/` nem versione arquivos locais, segredos ou dependências instaladas.

## Git e comunicação

- Escreva mensagens de commit em português do Brasil.
- Prefira mensagens objetivas no formato `tipo: descrição`, por exemplo:
  - `funcionalidade: adiciona filtro por projeto`
  - `correção: mantém quadro visível após navegar pela agenda`
  - `refinamento: suaviza animação de entrada`
- Não reescreva histórico, force push ou descarte alterações existentes sem autorização explícita.
- O branch principal do repositório é `main`.

## Critérios de conclusão

Uma tarefa só deve ser considerada concluída quando:

1. O comportamento solicitado estiver implementado.
2. A interface relevante tiver sido verificada no navegador quando aplicável.
3. `npm run lint` e `npm run build` passarem.
4. Não houver regressões evidentes no quadro, na agenda ou no login.
5. A documentação for atualizada quando a mudança afetar uso, arquitetura ou decisões permanentes do projeto.
