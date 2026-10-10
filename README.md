# Calendário — Praia das Castanheiras

Site estático, responsivo e minimalista para a programação de vôlei e futevôlei aos domingos, de outubro de 2026 a outubro de 2027.

## Arquivos
- `index.html` — estrutura da página
- `styles.css` — visual responsivo, tema claro/escuro
- `script.js` — calendário, filtros e alternância de tema

## Publicar na Vercel pelo GitHub
1. Crie um repositório no GitHub chamado `calendario-castanheiras`.
2. Envie `index.html`, `styles.css`, `script.js` e este `README.md` para a raiz do repositório.
3. Na Vercel, selecione **Add New → Project** e importe o repositório.
4. Como é um site estático, escolha **Other** em Framework Preset. Deixe Build Command e Output Directory vazios.
5. Clique em **Deploy** e teste o endereço gerado em um celular.

Não usa banco de dados, login, segredos nem variáveis de ambiente. Os visitantes só podem consultar o calendário. A fonte DM Sans/Manrope é carregada do Google Fonts quando há conexão; fontes do sistema são usadas como alternativa.
