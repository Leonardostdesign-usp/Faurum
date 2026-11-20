# Guia de Moderação — Faurum (FAUUSP)

Este documento contém os procedimentos de emergência e consultas SQL para a equipe de moderação e pesquisa da disciplina **AUH2820 (Cultura Urbana na Contemporaneidade)**.

---

## 1. Moderação Rápida via Script CLI

O projeto conta com o script automatizado `scripts/moderate.js`. Por padrão, ele opera no banco de **dev**. Para agir no banco de **produção**, adicione a flag `--prod` (o script solicitará a digitação de `faurum` para confirmar).

### Exemplos de uso:

```bash
# 1. Localizar dados de um usuário pelo nick (IP, fingerprint, curso, data)
node --env-file=.env scripts/moderate.js --prod user ana_clara

# 2. Investigar se um usuário tem contas adicionais (mesmo IP ou Fingerprint)
node --env-file=.env scripts/moderate.js --prod related ana_clara

# 3. Ocultar imediatamente uma resposta ofensiva ou spam
node --env-file=.env scripts/moderate.js --prod hide reply_abc123xyz

# 4. Desocultar uma resposta caso tenha sido moderada por engano
node --env-file=.env scripts/moderate.js --prod unhide reply_abc123xyz

# 5. Listar as últimas 20 respostas postadas
node --env-file=.env scripts/moderate.js --prod recent 20
```

---

## 2. Consultas SQL Diretas (Turso Web Console ou SQL Shell)

Caso prefira rodar consultas SQL puras no painel da web do Turso (`https://app.turso.tech` -> banco `faurum` -> **Edit Database** / **SQL Shell**), utilize as consultas abaixo:

### 2.1. Localizar usuário por Nick
```sql
SELECT id, nick, course, ip, fingerprint, created_at
FROM users
WHERE lower(nick) = lower('NICK_AQUI');
```

### 2.2. Ver IP e Fingerprint de um Nick específico
```sql
SELECT nick, ip, fingerprint, created_at
FROM users
WHERE lower(nick) = lower('NICK_AQUI');
```

### 2.3. Localizar outros nicks que compartilham o mesmo IP ou Fingerprint
```sql
-- Primeiro descubra o IP e Fingerprint com a consulta 2.2, depois execute:
SELECT nick, course, ip, fingerprint, created_at
FROM users
WHERE (ip = 'IP_DO_USUARIO' OR fingerprint = 'FINGERPRINT_DO_USUARIO')
  AND lower(nick) != lower('NICK_INVESTIGADO');
```

### 2.4. Ocultar uma resposta (Moderação suave / Flag de ocultamento)
A resposta não será excluída do banco (preservando o histórico para a pesquisa), mas o backend e o frontend deixarão de exibi-la para os alunos:
```sql
UPDATE replies
SET hidden = 1
WHERE id = 'ID_DA_RESPOSTA';
```

### 2.5. Reverter ocultamento de uma resposta
```sql
UPDATE replies
SET hidden = 0
WHERE id = 'ID_DA_RESPOSTA';
```

### 2.6. Listar as últimas 20 respostas enviadas
```sql
SELECT 
  id,
  topic_id,
  parent_id,
  author_nick,
  author_course,
  substr(body, 1, 60) AS preview,
  hidden,
  deleted_at,
  created_at
FROM replies
ORDER BY created_at DESC
LIMIT 20;
```

### 2.7. Visualizar todas as respostas de um usuário específico
```sql
SELECT 
  r.id,
  r.topic_id,
  r.parent_id,
  r.body,
  r.hidden,
  r.deleted_at,
  r.created_at
FROM replies r
JOIN users u ON u.id = r.author_id
WHERE lower(u.nick) = lower('NICK_AQUI')
ORDER BY r.created_at DESC;
```

### 2.8. Ocultar em lote todas as respostas de um usuário que cometeu spam grave
```sql
UPDATE replies
SET hidden = 1
WHERE author_id = (
  SELECT id FROM users WHERE lower(nick) = lower('NICK_SPAMMER')
);
```

---

## 3. Diretrizes Éticas e de Pesquisa

1. **Anonimato dos participantes:** O banco armazena apenas nick e curso escolhidos livremente pelo aluno, hash de sessão e dados de auditoria técnica (IP/Fingerprint).
2. **Preservação para a pesquisa:** Quando uma mensagem é apagada pelo próprio usuário, o texto é substituído por `[resposta apagada]` caso possua respostas filhas (para não quebrar a árvore de conversas) e preservado com `deleted_at`. Para moderação da equipe de pesquisa, utilize preferencialmente a flag `hidden = 1` em vez de deletar fisicamente, garantindo a integridade dos dados para a análise posterior da disciplina.
