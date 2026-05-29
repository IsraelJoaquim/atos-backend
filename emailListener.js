import Imap from 'imap';
import { simpleParser } from 'mailparser';
import prisma from './lib/prisma.js';
import { createTicket } from './src/services/ticketService.js';

function createImapConnection() {
  return new Imap({
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASS,
    host: 'imap.gmail.com',
    port: 993,
    tls: true,
    tlsOptions: { rejectUnauthorized: false },
  });
}

async function processEmail(buffer) {
  try {
    const parsed = await simpleParser(buffer);

    const fromEmail = parsed.from?.value?.[0]?.address?.toLowerCase();
    const subject = parsed.subject || 'Sem assunto';
    const body = parsed.text || parsed.html || 'Sem descrição';

    if (!fromEmail) {
      console.log('[IMAP] Email sem remetente, ignorando.');
      return;
    }

    // busca o usuário pelo email remetente
    const user = await prisma.users.findUnique({
      where: { email: fromEmail },
    });

    if (!user) {
      console.log(
        `[IMAP] Remetente ${fromEmail} não encontrado no sistema, ignorando.`,
      );
      return;
    }

    if (!user.active || !user.email_verified) {
      console.log(
        `[IMAP] Usuário ${fromEmail} inativo ou não verificado, ignorando.`,
      );
      return;
    }

    // cria o chamado com o subject como título e o body como descrição
    const ticket = await createTicket({
      title: subject.substring(0, 100),
      description: body.substring(0, 1000),
      userId: user.id,
      tenantId: user.tenantId,
    });

    console.log(
      `[IMAP] Chamado criado via email: ${ticket.ticket} — ${fromEmail}`,
    );
  } catch (error) {
    console.error('[IMAP] Erro ao processar email:', error.message);
  }
}

function fetchUnseenEmails(imap) {
  const today = new Date();
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  const dateStr = `${today.getDate()}-${months[today.getMonth()]}-${today.getFullYear()}`;

  imap.search(['UNSEEN', ['SINCE', dateStr]], (err, results) => {
    if (err) {
      console.error('[IMAP] Erro na busca:', err.message);
      return;
    }

    if (!results || results.length === 0) {
      console.log('[IMAP] Nenhum email novo.');
      return;
    }

    console.log(`[IMAP] ${results.length} email(s) novo(s) encontrado(s).`);

    const fetch = imap.fetch(results, { bodies: '', markSeen: true });

    fetch.on('message', msg => {
      const chunks = [];

      msg.on('body', stream => {
        stream.on('data', chunk => chunks.push(chunk));
        stream.on('end', () => {
          const buffer = Buffer.concat(chunks);
          processEmail(buffer);
        });
      });
    });

    fetch.once('error', err => {
      console.error('[IMAP] Erro ao buscar emails:', err.message);
    });
  });
}

// function fetchUnseenEmails(imap) {
//   imap.search(['UNSEEN'], (err, results) => {
//     if (err) {
//       console.error('[IMAP] Erro na busca:', err.message);
//       return;
//     }

//     if (!results || results.length === 0) {
//       console.log('[IMAP] Nenhum email novo.');
//       return;
//     }

//     console.log(`[IMAP] ${results.length} email(s) novo(s) encontrado(s).`);

//     const fetch = imap.fetch(results, { bodies: '', markSeen: true });

//     fetch.on('message', (msg) => {
//       const chunks = [];

//       msg.on('body', (stream) => {
//         stream.on('data', (chunk) => chunks.push(chunk));
//         stream.on('end', () => {
//           const buffer = Buffer.concat(chunks);
//           processEmail(buffer);
//         });
//       });
//     });

//     fetch.once('error', (err) => {
//       console.error('[IMAP] Erro ao buscar emails:', err.message);
//     });
//   });
// }

export function startEmailListener() {

   if (process.env.NODE_ENV === 'production') {
    console.log('[IMAP] Desabilitado em produção.');
    return;
  }

  console.log('[IMAP] Iniciando listener de emails...');


  console.log('[IMAP] Iniciando listener de emails...');

  function connect() {
    const imap = createImapConnection();

    imap.once('ready', () => {
      console.log('[IMAP] Conectado ao Gmail.');
      imap.openBox('INBOX', false, err => {
        if (err) {
          console.error('[IMAP] Erro ao abrir INBOX:', err.message);
          return;
        }

        // verifica emails não lidos ao conectar
        fetchUnseenEmails(imap);

        // escuta novos emails em tempo real
        imap.on('mail', () => {
          console.log('[IMAP] Novo email recebido.');
          fetchUnseenEmails(imap);
        });
      });
    });

    imap.once('error', err => {
      console.error('[IMAP] Erro de conexão:', err.message);
      console.log('[IMAP] Reconectando em 30 segundos...');
      setTimeout(connect, 30000);
    });

    imap.once('end', () => {
      console.log('[IMAP] Conexão encerrada. Reconectando em 30 segundos...');
      setTimeout(connect, 30000);
    });

    imap.connect();
  }

  connect();
}
