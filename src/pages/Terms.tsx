import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Terms = () => {
  return (
    <div className="min-h-screen bg-gradient-surface flex items-center justify-center p-6">
      <div className="w-full max-w-3xl">
        <Card className="glass border-0">
          <CardHeader>
            <CardTitle className="text-3xl">Terms of Service</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none text-foreground">
            <p className="text-text-subtle">Last updated: October 6, 2025</p>

            <h3>1. Agreement</h3>
            <p>
              By accessing or using this service, you agree to be bound by these
              Terms of Service. If you do not agree to these terms, do not use the
              service.
            </p>

            <h3>2. Use of the Service</h3>
            <p>
              You must use the service in compliance with applicable laws and
              regulations. You are responsible for all activity that occurs under
              your account and for maintaining the security of your credentials.
            </p>

            <h3>3. Messaging and Content</h3>
            <p>
              You are solely responsible for the content you send through the
              platform, including obtaining necessary consents and honoring opt-in
              and opt-out requirements. Prohibited content includes spam, illegal
              content, and abusive or deceptive messages.
            </p>

            <h3>4. Fees and Billing</h3>
            <p>
              Certain features may require payment. Prices and billing terms are
              presented at checkout. Taxes may apply. We may change prices with
              reasonable notice.
            </p>

            <h3>5. Availability and Support</h3>
            <p>
              We strive for high availability but do not guarantee uninterrupted
              service. Planned maintenance and unforeseen outages may occur.
            </p>

            <h3>6. Data and Privacy</h3>
            <p>
              Our handling of personal data is described in our
              {" "}
              <Link to="/privacy" className="text-primary underline">Privacy Policy</Link>.
            </p>

            <h3>7. Intellectual Property</h3>
            <p>
              The platform and its content (excluding user content) are owned by
              us or our licensors and are protected by intellectual property laws.
            </p>

            <h3>8. Termination</h3>
            <p>
              We may suspend or terminate access if you violate these terms or use
              the service in a harmful manner. You may stop using the service at
              any time.
            </p>

            <h3>9. Disclaimers and Limitation of Liability</h3>
            <p>
              The service is provided "as is" without warranties of any kind. To
              the maximum extent permitted by law, we are not liable for indirect
              or consequential damages.
            </p>

            <h3>10. Changes</h3>
            <p>
              We may modify these terms from time to time. Continued use of the
              service after changes become effective constitutes acceptance of the
              updated terms.
            </p>

            <h3>11. Contact</h3>
            <p>
              Questions about these terms? Contact us via the support channels in
              your account.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Terms;


