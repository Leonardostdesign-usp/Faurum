import { getDb } from './lib/db.js';

// Parse arguments
const args = process.argv.slice(2);
const isProd = args.includes('--prod');
const cleanArgs = args.filter(a => a !== '--prod');
const [action, target, ...extra] = cleanArgs;

async function main() {
  if (!action) {
    console.log(`
Uso do script de moderação:
  node --env-file=.env scripts/moderate.js [--prod] <ação> [parâmetros]

Ações disponíveis:
  user <nick>           Mostra dados do usuário (ID, nick, curso, IP, fingerprint, data)
  related <nick>        Busca outros usuários com mesmo IP ou fingerprint
  hide <reply_id>       Oculta uma resposta (hidden = 1)
  unhide <reply_id>     Desoculta uma resposta (hidden = 0)
  recent [limite]       Lista as respostas mais recentes (padrão: 15)
  sql "<query>"         Executa uma consulta SQL arbitrária
    `);
    process.exit(0);
  }

  const db = await getDb({ prod: isProd });

  try {
    switch (action) {
      case 'user': {
        if (!target) throw new Error('Informe o nick: node scripts/moderate.js user <nick>');
        const res = await db.execute({
          sql: `SELECT id, nick, course, ip, fingerprint, created_at FROM users WHERE lower(nick) = lower(?)`,
          args: [target]
        });
        if (res.rows.length === 0) {
          console.log(`Nenhum usuário encontrado com o nick "${target}".`);
        } else {
          console.log(`\n--- Usuário encontrado ---`);
          console.table(res.rows);
        }
        break;
      }

      case 'related': {
        if (!target) throw new Error('Informe o nick: node scripts/moderate.js related <nick>');
        const userRes = await db.execute({
          sql: `SELECT id, nick, ip, fingerprint FROM users WHERE lower(nick) = lower(?)`,
          args: [target]
        });
        if (userRes.rows.length === 0) {
          console.log(`Nenhum usuário encontrado com o nick "${target}".`);
          break;
        }
        const user = userRes.rows[0];
        console.log(`Buscando nicks relacionados a @${user.nick} (IP: ${user.ip}, Fingerprint: ${user.fingerprint})...`);

        const relatedRes = await db.execute({
          sql: `SELECT id, nick, course, ip, fingerprint, created_at 
                FROM users 
                WHERE (ip = ? OR fingerprint = ?) AND lower(nick) != lower(?)`,
          args: [user.ip, user.fingerprint, target]
        });

        if (relatedRes.rows.length === 0) {
          console.log('Nenhum outro usuário compartilha este IP ou fingerprint.');
        } else {
          console.log(`\n--- Usuários relacionados ---`);
          console.table(relatedRes.rows);
        }
        break;
      }

      case 'hide': {
        if (!target) throw new Error('Informe o ID da resposta: node scripts/moderate.js hide <reply_id>');
        const res = await db.execute({
          sql: `UPDATE replies SET hidden = 1 WHERE id = ? RETURNING id, topic_id, author_nick, body, hidden`,
          args: [target]
        });
        if (res.rows.length === 0) {
          console.log(`Resposta com ID ${target} não encontrada.`);
        } else {
          console.log(`✓ Resposta ${target} ocultada com sucesso (hidden = 1).`);
        }
        break;
      }

      case 'unhide': {
        if (!target) throw new Error('Informe o ID da resposta: node scripts/moderate.js unhide <reply_id>');
        const res = await db.execute({
          sql: `UPDATE replies SET hidden = 0 WHERE id = ? RETURNING id, topic_id, author_nick, body, hidden`,
          args: [target]
        });
        if (res.rows.length === 0) {
          console.log(`Resposta com ID ${target} não encontrada.`);
        } else {
          console.log(`✓ Resposta ${target} desocultada com sucesso (hidden = 0).`);
        }
        break;
      }

      case 'recent': {
        const limit = parseInt(target, 10) || 15;
        const res = await db.execute({
          sql: `SELECT id, topic_id, parent_id, author_nick, substr(body, 1, 40) as preview, hidden, deleted_at, created_at
                FROM replies 
                ORDER BY created_at DESC 
                LIMIT ?`,
          args: [limit]
        });
        console.log(`\n--- Últimas ${res.rows.length} respostas ---`);
        console.table(res.rows);
        break;
      }

      case 'sql': {
        if (!target) throw new Error('Informe a query SQL entre aspas.');
        const res = await db.execute(target);
        console.log(`\n--- Resultado (${res.rows.length} linhas) ---`);
        console.table(res.rows);
        break;
      }

      default:
        console.error(`Ação desconhecida: "${action}". Use 'user', 'related', 'hide', 'unhide', 'recent' ou 'sql'.`);
    }
  } catch (err) {
    console.error(`Erro ao executar moderação: ${err.message}`);
    process.exit(1);
  }
}

main();
