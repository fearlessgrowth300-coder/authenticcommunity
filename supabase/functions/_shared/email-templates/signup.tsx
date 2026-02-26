/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
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

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
  token?: string
}

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  token,
}: SignupEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your verification code for Authentic Community 🌟</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Text style={logoText}>🌟 Authentic Community</Text>
        </Section>
        <Heading style={h1}>Verify your email</Heading>
        <Text style={text}>
          Thanks for joining{' '}
          <Link href={siteUrl} style={link}>
            <strong>Authentic Community</strong>
          </Link>
          — we're excited to help you find genuine connections, meaningful friendships, and communities that feel like home.
        </Text>
        <Text style={text}>
          Use the code below to verify your email ({recipient}):
        </Text>
        <Section style={codeSection}>
          <Text style={codeLabel}>Your Verification Code</Text>
          <Text style={codeStyle}>{token || '------'}</Text>
          <Text style={codeHint}>⏱️ This code expires in 15 minutes</Text>
        </Section>
        <Text style={text}>
          Enter this code in the verification screen to confirm your email address.
        </Text>
        <Section style={securityNote}>
          <Text style={securityText}>
            🔒 Never share this code with anyone. We'll never ask for it via email or message.
          </Text>
        </Section>
        <Hr style={hr} />
        <Text style={footer}>
          If you didn't create an account, you can safely ignore this email.
        </Text>
        <Text style={footerBrand}>© Authentic Community</Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

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
const codeSection = {
  backgroundColor: '#f3f4f6',
  borderRadius: '12px',
  padding: '28px',
  textAlign: 'center' as const,
  margin: '24px 0',
}
const codeLabel = { fontSize: '13px', color: '#6b7280', margin: '0 0 12px' }
const codeStyle = {
  fontFamily: "'Courier New', monospace",
  fontSize: '42px',
  fontWeight: 'bold' as const,
  color: '#3b82f6',
  letterSpacing: '8px',
  margin: '0 0 12px',
}
const codeHint = { fontSize: '13px', color: '#ef4444', margin: '0' }
const securityNote = {
  backgroundColor: '#eff6ff',
  borderLeft: '4px solid #3b82f6',
  padding: '12px 16px',
  borderRadius: '4px',
  margin: '20px 0',
}
const securityText = { fontSize: '13px', color: '#1e40af', margin: '0' }
const hr = { borderColor: '#e5e7eb', margin: '28px 0' }
const footer = { fontSize: '13px', color: '#9ca3af', margin: '0 0 8px' }
const footerBrand = { fontSize: '12px', color: '#9ca3af', textAlign: 'center' as const }
