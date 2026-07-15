export default function PrivacyPage() {
  return (
    <div className="py-24 px-6">
      <div className="max-w-3xl mx-auto glass-card p-10 bg-surface-900 border-surface-800">
        <h1 className="text-4xl font-bold text-white mb-8 font-display">Privacy Policy</h1>
        <div className="space-y-6 text-surface-300">
          <p>Last updated: October 1, 2024</p>
          
          <h2 className="text-2xl font-bold text-white mt-8 mb-4 font-display">1. Introduction</h2>
          <p>
            Shyara Tech Solution (OPC) Pvt. Ltd. ("we", "us", "our") operates the TableFlow platform. We respect your privacy and are committed to protecting your personal data in compliance with the Digital Personal Data Protection (DPDP) Act 2023 of India.
          </p>

          <h2 className="text-2xl font-bold text-white mt-8 mb-4 font-display">2. Data Collection and Usage</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>For Business Owners:</strong> We collect your name, email, phone number, and business details to provide our service, process subscriptions, and communicate with you.</li>
            <li><strong>For End Customers:</strong> When booking a table, we collect your name and phone number. This data is collected on behalf of the restaurant you are booking with. We do not sell or use customer booking data for marketing our own services.</li>
          </ul>

          <h2 className="text-2xl font-bold text-white mt-8 mb-4 font-display">3. Digital Personal Data Protection (DPDP) Act 2023 Compliance</h2>
          <p>
            We adhere to the principles laid out in the DPDP Act 2023:
          </p>
          <ul className="list-disc pl-5 space-y-2 mt-2">
            <li>We only process personal data for the lawful purpose it was collected.</li>
            <li>You have the right to access, correct, and erase your personal data (Right to be Forgotten).</li>
            <li>We implement reasonable security safeguards to prevent data breaches.</li>
            <li>We notify users of any data breaches as required by the law.</li>
          </ul>

          <h2 className="text-2xl font-bold text-white mt-8 mb-4 font-display">4. Data Retention</h2>
          <p>
            We retain your data only for as long as necessary to provide our services. If you cancel your subscription, we will anonymize or delete your personal data in accordance with our data retention policy (typically within 30 days of account closure).
          </p>

          <h2 className="text-2xl font-bold text-white mt-8 mb-4 font-display">5. Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy or wish to exercise your data rights under the DPDP Act, please contact us via our Contact page.
          </p>
        </div>
      </div>
    </div>
  );
}
