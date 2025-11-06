<template>
  <v-container>
    <h1 class="text-center" style="font-weight: 600; font-size: 46px">
      Security Policy
    </h1>
    <v-card-text
      style="
        font-weight: 400;
        font-size: 14px;
        color: #1e1e1e;
        flex: 1;
        padding-bottom: 32px;
      "
    >
      <p>
        This Security Policy ("Policy") outlines the security measures and practices implemented by 
        FlosslyOS Ltd. ("Flossly," "we," "us," or "our") to protect the confidentiality, integrity, 
        and availability of our AI Powered Task Manager & CRM software ("Platform") and the data 
        processed through it.
      </p>
      <p>
        We are committed to maintaining the highest standards of security to protect our users' 
        information and ensure the safe operation of our Platform. This Policy describes our 
        comprehensive security framework and ongoing security practices.
      </p>
      <p>
        By using our Platform, you acknowledge that you have read and understood this Security Policy. 
        We reserve the right to update this Policy as needed to reflect changes in our security practices 
        or applicable regulations.
      </p>

      <!-- Section 1 -->
      <h3 class="terms-heading mt-6">1. Security Framework</h3>
      <p>
        Our security framework is built on industry best practices and compliance standards, including:
      </p>
      <ul class="ml-6 list-disc">
        <li>ISO 27001 Information Security Management System</li>
        <li>GDPR and UK Data Protection Act 2018 compliance</li>
        <li>NIST Cybersecurity Framework alignment</li>
        <li>Healthcare industry security standards (for medical data)</li>
        <li>Regular third-party security assessments</li>
      </ul>

      <!-- Section 2 -->
      <h3 class="terms-heading mt-6">2. Data Encryption</h3>
      <p>We implement multiple layers of encryption to protect your data:</p>
      <ul class="ml-6 list-disc">
        <li><strong>Data in Transit:</strong> TLS 1.3 encryption for all data transmission</li>
        <li><strong>Data at Rest:</strong> AES-256 encryption for stored data</li>
        <li><strong>Database Encryption:</strong> Transparent Data Encryption (TDE) for databases</li>
        <li><strong>File Storage:</strong> Encrypted file storage with secure key management</li>
        <li><strong>Backup Encryption:</strong> All backups are encrypted before storage</li>
      </ul>

      <!-- Section 3 -->
      <h3 class="terms-heading mt-6">3. Access Controls and Authentication</h3>
      <p>We maintain strict access controls to ensure only authorised personnel can access your data:</p>
      <ul class="ml-6 list-disc">
        <li>Multi-factor authentication (MFA) for all user accounts</li>
        <li>Role-based access control (RBAC) with principle of least privilege</li>
        <li>Regular access reviews and privilege audits</li>
        <li>Strong password policies and regular password updates</li>
        <li>Session management with automatic timeout</li>
        <li>IP whitelisting for administrative access</li>
      </ul>

      <!-- Section 4 -->
      <h3 class="terms-heading mt-6">4. Infrastructure Security</h3>
      <p>Our infrastructure is designed with security as a primary consideration:</p>
      <ul class="ml-6 list-disc">
        <li>Secure cloud hosting with enterprise-grade security</li>
        <li>Network segmentation and firewall protection</li>
        <li>Intrusion detection and prevention systems (IDS/IPS)</li>
        <li>Regular security patching and updates</li>
        <li>DDoS protection and traffic filtering</li>
        <li>Secure configuration management</li>
      </ul>

      <!-- Section 5 -->
      <h3 class="terms-heading mt-6">5. Application Security</h3>
      <p>Our Platform is developed and maintained with security best practices:</p>
      <ul class="ml-6 list-disc">
        <li>Secure coding practices and regular code reviews</li>
        <li>Automated security testing in CI/CD pipeline</li>
        <li>Regular penetration testing and vulnerability assessments</li>
        <li>Input validation and output encoding</li>
        <li>SQL injection and XSS prevention measures</li>
        <li>API security with rate limiting and authentication</li>
      </ul>

      <!-- Section 6 -->
      <h3 class="terms-heading mt-6">6. Data Protection and Privacy</h3>
      <p>We implement comprehensive data protection measures:</p>
      <ul class="ml-6 list-disc">
        <li>Data minimisation and purpose limitation</li>
        <li>Pseudonymization and anonymization where appropriate</li>
        <li>Data retention policies and secure deletion</li>
        <li>Cross-border data transfer safeguards</li>
        <li>Regular data protection impact assessments</li>
        <li>Privacy by design and default principles</li>
      </ul>

      <!-- Section 7 -->
      <h3 class="terms-heading mt-6">7. Incident Response</h3>
      <p>We maintain a comprehensive incident response plan:</p>
      <ul class="ml-6 list-disc">
        <li>24/7 security monitoring and alerting</li>
        <li>Dedicated incident response team</li>
        <li>Automated threat detection and response</li>
        <li>Regular incident response drills and training</li>
        <li>Communication protocols for security incidents</li>
        <li>Post-incident analysis and improvement processes</li>
      </ul>

      <!-- Section 8 -->
      <h3 class="terms-heading mt-6">8. Employee Security</h3>
      <p>Our team is trained and committed to maintaining security:</p>
      <ul class="ml-6 list-disc">
        <li>Background checks for all employees</li>
        <li>Regular security awareness training</li>
        <li>Confidentiality agreements and security policies</li>
        <li>Secure development training for technical staff</li>
        <li>Incident reporting procedures</li>
        <li>Regular security policy updates and communication</li>
      </ul>

      <!-- Section 9 -->
      <h3 class="terms-heading mt-6">9. Third-Party Security</h3>
      <p>We ensure our partners and vendors maintain high security standards:</p>
      <ul class="ml-6 list-disc">
        <li>Vendor security assessments and due diligence</li>
        <li>Data processing agreements with security requirements</li>
        <li>Regular vendor security reviews</li>
        <li>Incident notification requirements</li>
        <li>Compliance verification and audits</li>
        <li>Secure integration and API management</li>
      </ul>

      <!-- Section 10 -->
      <h3 class="terms-heading mt-6">10. Compliance and Auditing</h3>
      <p>We maintain compliance with relevant security standards:</p>
      <ul class="ml-6 list-disc">
        <li>Regular internal security audits</li>
        <li>Third-party security assessments</li>
        <li>Compliance monitoring and reporting</li>
        <li>Security metrics and KPIs tracking</li>
        <li>Continuous improvement processes</li>
        <li>Regulatory compliance verification</li>
      </ul>

      <!-- Section 11 -->
      <h3 class="terms-heading mt-6">11. Business Continuity</h3>
      <p>We maintain business continuity and disaster recovery capabilities:</p>
      <ul class="ml-6 list-disc">
        <li>Regular data backups with tested restoration procedures</li>
        <li>Disaster recovery planning and testing</li>
        <li>Redundant systems and fail-over capabilities</li>
        <li>Business continuity planning</li>
        <li>Service availability monitoring</li>
        <li>Recovery time and point objectives (RTO/RPO)</li>
      </ul>

      <!-- Section 12 -->
      <h3 class="terms-heading mt-6">12. Security Monitoring and Logging</h3>
      <p>We maintain comprehensive security monitoring:</p>
      <ul class="ml-6 list-disc">
        <li>Centralised logging and monitoring systems</li>
        <li>Real-time security event analysis</li>
        <li>Anomaly detection and behavioural analysis</li>
        <li>Security information and event management (SIEM)</li>
        <li>Regular log review and analysis</li>
        <li>Threat intelligence integration</li>
      </ul>

      <!-- Section 13 -->
      <h3 class="terms-heading mt-6">13. Updates and Maintenance</h3>
      <p>
        We regularly update our security measures to address emerging threats and maintain 
        the highest security standards. This includes:
      </p>
      <ul class="ml-6 list-disc">
        <li>Regular security patch management</li>
        <li>Security tool and technology updates</li>
        <li>Policy and procedure reviews</li>
        <li>Staff training updates</li>
        <li>Threat landscape monitoring</li>
        <li>Security architecture improvements</li>
      </ul>

      <!-- Section 14 -->
      <h3 class="terms-heading mt-6">14. Reporting Security Issues</h3>
      <p>
        If you discover a security vulnerability or have concerns about our security practices, 
        please report them to us immediately:
      </p>
      <p>
        Email: security@flossly.co.uk<br>
        Phone: [Security Hotline Number]<br>
        Address: FlosslyOS Ltd, [Company Address]
      </p>
      <p>
        We take all security reports seriously and will investigate and respond promptly. 
        We appreciate your help in keeping our Platform secure.
      </p>

      <!-- Section 15 -->
      <h3 class="terms-heading mt-6">15. Contact Us</h3>
      <p>
        If you have any questions about this Security Policy or our security practices, 
        please contact us at:
      </p>
      <p>
        Email: security@flossly.co.uk<br>
        Address: FlosslyOS Ltd, [Company Address]<br>
        Phone: [Contact Number]
      </p>
    </v-card-text>
  </v-container>
</template>

<script setup></script>

<style scoped>
.terms-heading {
  font-weight: 600;
  font-size: 20px;
  color: #1e1e1e;
}
</style>
