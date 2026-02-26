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
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface MagicLinkEmailProps {
  siteName: string
  confirmationUrl: string
}

export const MagicLinkEmail = ({
  siteName,
  confirmationUrl,
}: MagicLinkEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your login link for Authentic Community</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Text style={logoText}>🌟 Authentic Community</Text>
        </Section>
        <Heading style={h1}>Your login link</Heading>
        <Text style={text}>
          Hey! Click the button below to sign in. This link will expire shortly, so use it soon.
        </Text>
        <Section style={buttonSection}>
          <Button style={button} href={confirmationUrl}>
            Sign In
          </Button>
        </Section>
        <Hr style={hr} />
        <Text style={footer}>
          If you didn't request this link, you can safely ignore this email.
        </Text>
        <Text style={footerBrand}>© Authentic Community</Text>
      </Container>
    </Body>
  </Html>
)

export default MagicLinkEmail

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
const hr = { borderColor: '#e5e7eb', margin: '28px 0' }
const footer = { fontSize: '13px', color: '#9ca3af', margin: '0 0 8px' }
const footerBrand = { fontSize: '12px', color: '#9ca3af', textAlign: 'center' as const }
