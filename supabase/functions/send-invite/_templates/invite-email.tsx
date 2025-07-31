import React from 'npm:react@18.3.1';
import { 
  Body, 
  Container, 
  Head, 
  Heading, 
  Html, 
  Link, 
  Preview, 
  Section,
  Text 
} from 'npm:@react-email/components@0.0.22';

interface InviteEmailProps {
  organizationName: string;
  inviterName: string;
  role: string;
  inviteUrl: string;
  expiresAt: string;
}

export const InviteEmail = ({
  organizationName,
  inviterName,
  role,
  inviteUrl,
  expiresAt
}: InviteEmailProps) => {
  const expirationDate = new Date(expiresAt).toLocaleDateString('pt-BR');
  
  return (
    <Html>
      <Head />
      <Preview>Você foi convidado para se juntar à {organizationName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Convite para {organizationName}</Heading>
          
          <Text style={text}>
            Olá! Você foi convidado por <strong>{inviterName}</strong> para se juntar à 
            organização <strong>{organizationName}</strong> como <strong>{role}</strong>.
          </Text>

          <Section style={buttonContainer}>
            <Link href={inviteUrl} style={button}>
              Aceitar Convite
            </Link>
          </Section>

          <Text style={text}>
            Ou copie e cole este link no seu navegador:
          </Text>
          <Text style={linkText}>{inviteUrl}</Text>

          <Text style={warningText}>
            ⚠️ Este convite expira em {expirationDate}. Certifique-se de aceitá-lo antes desta data.
          </Text>

          <Text style={footerText}>
            Se você não esperava este convite ou não reconhece o remetente, 
            pode ignorar este email com segurança.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default InviteEmail;

// Estilos
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '580px',
  borderRadius: '8px',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
};

const h1 = {
  color: '#1f2937',
  fontSize: '32px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0',
  textAlign: 'center' as const,
};

const text = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '24px 20px',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#3b82f6',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 32px',
  margin: '0 auto',
};

const linkText = {
  color: '#6b7280',
  fontSize: '14px',
  margin: '16px 20px',
  wordBreak: 'break-all' as const,
  backgroundColor: '#f9fafb',
  padding: '12px',
  borderRadius: '4px',
  border: '1px solid #e5e7eb',
};

const warningText = {
  color: '#d97706',
  fontSize: '14px',
  margin: '24px 20px',
  padding: '12px',
  backgroundColor: '#fef3c7',
  borderRadius: '4px',
  border: '1px solid #fbbf24',
};

const footerText = {
  color: '#6b7280',
  fontSize: '12px',
  lineHeight: '18px',
  margin: '32px 20px 20px',
  textAlign: 'center' as const,
};