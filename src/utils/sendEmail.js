import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail(to, subject, text) {
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_USER, // ← funciona sem domínio próprio
      to,
      subject,
      text,
    });

    if (error) {
      console.error('Erro ao enviar e-mail:', error);
      throw error;
    }

    console.log('E-mail enviado:', data.id);
    return data;
  } catch (error) {
    console.error('Erro ao enviar e-mail:', error);
    throw error;
  }
}

// import nodemailer from 'nodemailer';

// export async function sendEmail(to, subject, text) {
//   try {
//     const transporter = nodemailer.createTransport({
//       host: process.env.EMAIL_HOST,
//       port: parseInt(process.env.EMAIL_PORT),
//       secure: process.env.EMAIL_SECURE === 'true', // false para 587 ✓
//       requireTLS: true,                             // ← ADD: força STARTTLS
//       auth: {
//         user: process.env.EMAIL_USER,
//         pass: process.env.EMAIL_PASS,
//       },
//       tls: {
//         rejectUnauthorized: false, // ← ADD: evita erro de certificado em alguns deploys
//       },
//     });

//     // ← ADD: verifica conexão antes de tentar enviar
//     await transporter.verify();
//     console.log('Conexão SMTP ok');

//     const info = await transporter.sendMail({
//       from: process.env.EMAIL_USER,
//       to,
//       subject,
//       text,
//     });

//     console.log('E-mail enviado:', info.messageId);
//     return info;
//   } catch (error) {
//     // ← FIX: mostra o erro real, não uma mensagem genérica
//     console.error('Erro ao enviar e-mail:', {
//       message: error.message,
//       code: error.code,       // ex: ECONNREFUSED, EAUTH, ETIMEDOUT
//       command: error.command, // qual comando SMTP falhou
//     });
//     throw error; // joga o erro original
//   }
// }
