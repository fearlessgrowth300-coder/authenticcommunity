/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface EmailChangeEmailProps {
  siteName: string
  email: string
  newEmail: string
  confirmationUrl: string
}

export const EmailChangeEmail = ({
  siteName,
  email,
  newEmail,
  confirmationUrl,
}: EmailChangeEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Confirm your email change for Authentic Community</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Text style={logoText}>🌟 Authentic Community</Text>
        </Section>
        <Heading style={h1}>Confirm your new email</Heading>
        <Text style={text}>
          You requested to change your email from{' '}
          <Link href={`mailto:${email}`} style={link}>{email}</Link>{' '}
          to{' '}
          <Link href={`mailto:${newEmail}`} style={link}>{newEmail}</Link>.
        </Text>
        <Section style={buttonSection}>
          <Button style={button} href={confirmationUrl}>
            Confirm Email Change
          </Button>
        </Section>
        <Section style={securityNote}>
          <Text style={securityText}>
            🔒 If you didn't request this change, please secure your account immediately.
          </Text>
        </Section>
        <Hr style={hr} />
        <Text style={footerBrand}>© Authentic Community</Text>
      </Container>
    </Body>
  </Html>
)

export default EmailChangeEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif" }
const container = { padding: '40px 24px', maxWidth: '560px', margin: '0 auto' }
const header = { textAlign: 'center' as const, marginBottom: '24px' }
const logoText = { fontSize: '20px', fontWeight: 'bold' as const, color: '#3b82f6', fontFamily: "'Poppins', 'Inter', Arial, sans-serif" }
const h1 = {
  fontSize: '24px',
  fontWeight: 'bold' as const,
  color: '#181c25',
  margin: '0 0 16px',
  fontFamily: "'Poppins', 'Inter', Arial, sans-serif",
}
const text = {
  fontSize: '15px',
  color: '#6b7280',
  lineHeight: '1.6',
  margin: '0 0 20px',
}
const link = { color: '#3b82f6', textDecoration: 'underline' }
const buttonSection = { textAlign: 'center' as const, margin: '28px 0' }
const button = {
  background: 'linear-gradient(135deg, #3b82f6 0%, #ec4899 100%)',
  backgroundColor: '#3b82f6',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: '600' as const,
  borderRadius: '12px',
  padding: '14px 32px',
  textDecoration: 'none',
}
const securityNote = {
  backgroundColor: '#eff6ff',
  borderLeft: '4px solid #3b82f6',
  padding: '12px 16px',
  borderRadius: '4px',
  margin: '20px 0',
}
const securityText = { fontSize: '13px', color: '#1e40af', margin: '0' }
const hr = { borderColor: '#e5e7eb', margin: '28px 0' }
const footerBrand = { fontSize: '12px', color: '#9ca3af', textAlign: 'center' as const }
