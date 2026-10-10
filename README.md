# Calendário de vôlei e futevôlei — Praia das Castanheiras

Site estático com calendário público e painel administrativo integrado ao Supabase.

## Funcionalidades
- Calendário de 04/10/2026 a 31/10/2027.
- Filtros por mês e modalidade, seção de dias passados e tema claro/escuro.
- Login administrativo via Supabase Auth.
- A edição só é mostrada para a conta cuja app_metadata.role seja "admin".
- RLS no Supabase protege as alterações no banco; ocultar controles no navegador não é a segurança principal.
- Histórico de alterações e horário da última atualização vêm das tabelas do banco.

## Supabase
O site usa a URL do projeto e a chave publishable pública no navegador. Nunca adicionar uma chave service_role ao frontend.
Tabelas esperadas: calendar_events (id, event_date, modality, updated_at, updated_by), calendar_change_log (event_date, old_modality, new_modality, action, changed_at) e calendar_site_state (id, last_updated_at, last_updated_by).
O projeto já possui gatilhos para gravar histórico e atualizar o estado do site.

## Implantação
Suba index.html, script.js, styles.css e README.md para a raiz do repositório conectado à Vercel. O site é estático e não exige build.
