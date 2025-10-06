import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-gradient-surface flex items-center justify-center p-6">
      <div className="w-full max-w-3xl">
        <Card className="glass border-0">
          <CardHeader>
            <CardTitle className="text-3xl">Privacy Policy</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none text-foreground">
            <p className="text-text-subtle">Last updated: October 6, 2025</p>

            <h3>Overview</h3>
            <p>
              This Privacy Policy explains how we collect, use, and protect
              personal information when you use our platform.
            </p>

            <h3>Information We Collect</h3>
            <ul>
              <li>Account details such as name, email, and phone number.</li>
              <li>Usage data like device, browser, and activity logs.</li>
              <li>Message content and recipients where required to deliver the service.</li>
            </ul>

            <h3>How We Use Information</h3>
            <ul>
              <li>To provide and improve the service.</li>
              <li>To communicate updates and support.</li>
              <li>To ensure security, prevent fraud, and comply with law.</li>
            </ul>

            <h3>Sharing</h3>
            <p>
              We may share data with vendors who process information on our behalf
              under appropriate agreements, and as required by law. We do not sell
              personal data.
            </p>

            <h3>Data Retention</h3>
            <p>
              We retain information for as long as needed to deliver the service
              and meet legal obligations. You may request deletion where
              applicable.
            </p>

            <h3>Your Rights</h3>
            <p>
              Depending on your location, you may have rights to access, correct,
              or delete personal data and to object to certain processing.
            </p>

            <h3>Security</h3>
            <p>
              We implement reasonable technical and organizational measures to
              protect personal information. No method is 100% secure.
            </p>

            <h3>International Transfers</h3>
            <p>
              Where data is transferred across borders, we use appropriate
              safeguards consistent with applicable laws.
            </p>

            <h3>Changes to this Policy</h3>
            <p>
              We may update this policy from time to time. We will indicate the
              date of the latest revision at the top of this page.
            </p>

            <h3>Contact Us</h3>
            <p>
              For privacy inquiries, please reach out via your account support
              channel.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Privacy;


